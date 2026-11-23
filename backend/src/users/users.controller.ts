import { errorBody } from 'src/common/error-body';
import { ParseIdPipe } from 'src/common/pipes/parse-id.pipe';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ForbiddenErrorDto,
  NotFoundErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { SESSION_AUTH } from 'src/common/swagger/swagger.setup';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserDto } from './dtos/user.dto';
import { SigninDto } from './dtos/signIn-user.dto';
import { plainToInstance } from 'class-transformer';
import {
  clearSessionCookieOptions,
  SESSION_COOKIE,
  sessionCookieOptions,
} from './session-cookie';
import { AdminGuard } from 'src/guards/admin.guard';
import { UserRole } from 'src/enums/user-role.enum';

@ApiTags('auth')
@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Get('/context')
  @UseGuards(AuthGuard)
  @ApiCookieAuth(SESSION_AUTH)
  @ApiOperation({
    summary: 'Zwróć dane zalogowanego użytkownika',
    description:
      'Na podstawie tokenu JWT odczytuje ID użytkownika z payload i zwraca pełny rekord z bazy.',
  })
  @ApiUnauthorizedResponse({
    description: 'Brak lub nieważne cookie sesji',
    type: UnauthorizedErrorDto,
  })
  @ApiOkResponse({ description: 'Dane bieżącego użytkownika', type: UserDto })
  async getContext(@CurrentUser() user: User) {
    const found = await this.usersService.findOne(user.id);
    return plainToInstance(UserDto, found, { excludeExtraneousValues: true });
  }

  @Post('/signup')
  @ApiOperation({
    summary: 'Rejestracja nowego użytkownika',
    description:
      'Tworzy konto, hashuje hasło algorytmem scrypt i ustawia cookie sesji (httpOnly, ważne 7 dni).',
  })
  @ApiCreatedResponse({
    description: 'Konto utworzone, cookie sesji ustawione',
    type: UserDto,
  })
  @ApiBadRequestResponse({
    description:
      'Nieprawidłowe dane lub e-mail jest już zajęty (kod EMAIL_IN_USE)',
    type: BadRequestErrorDto,
  })
  async signUp(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.signup(
      body.email,
      body.password,
      body.name,
      body.surname,
    );
    res.cookie(SESSION_COOKIE, access_token, sessionCookieOptions());
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  @Post('/signin')
  @ApiOperation({
    summary: 'Logowanie użytkownika',
    description:
      'Weryfikuje hasło i ustawia cookie sesji (httpOnly, ważne 7 dni). Kolejne żądania z tej przeglądarki, także z tego widoku Swaggera, są uwierzytelniane automatycznie.',
  })
  @ApiCreatedResponse({
    description: 'Zalogowano, cookie sesji ustawione',
    type: UserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Nieprawidłowy e-mail lub hasło (kod INVALID_CREDENTIALS)',
    type: UnauthorizedErrorDto,
  })
  async signin(
    @Body() body: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.signin(
      body.email,
      body.password,
    );
    res.cookie(SESSION_COOKIE, access_token, sessionCookieOptions());
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  @Post('/signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Wylogowanie',
    description: 'Usuwa cookie sesji.',
  })
  @ApiNoContentResponse({ description: 'Wylogowano' })
  signout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions());
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Usuń użytkownika po ID' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID użytkownika do usunięcia',
  })
  @ApiNotFoundResponse({
    description: 'Użytkownik nie znaleziony',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Usunięty użytkownik', type: User })
  @ApiCookieAuth(SESSION_AUTH)
  @ApiUnauthorizedResponse({
    description: 'Brak lub nieważne cookie sesji',
    type: UnauthorizedErrorDto,
  })
  @ApiForbiddenResponse({
    description: 'Wymagana rola admina (kod ADMIN_REQUIRED)',
    type: ForbiddenErrorDto,
  })
  removeUser(@Param('id', ParseIdPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Patch('/:id')
  @ApiCookieAuth(SESSION_AUTH)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zaktualizuj dane użytkownika',
    description: 'Pola pominięte w body pozostają bez zmian (partial update).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID użytkownika do aktualizacji',
  })
  @ApiNotFoundResponse({
    description: 'Użytkownik nie znaleziony',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Zaktualizowany użytkownik', type: User })
  @ApiUnauthorizedResponse({
    description: 'Brak lub nieważne cookie sesji',
    type: UnauthorizedErrorDto,
  })
  @ApiForbiddenResponse({
    description:
      'Można edytować tylko własne konto, a rolę zmienia tylko admin',
    type: ForbiddenErrorDto,
  })
  updateUser(
    @Param('id', ParseIdPipe) id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isSelf = currentUser.id === id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException(
        errorBody(HttpStatus.FORBIDDEN, 'ACCESS_DENIED', 'Access denied'),
      );
    }
    if (!isAdmin && body.role !== undefined) {
      throw new ForbiddenException(
        errorBody(HttpStatus.FORBIDDEN, 'ACCESS_DENIED', 'Access denied'),
      );
    }
    return this.usersService.update(id, body);
  }
}
