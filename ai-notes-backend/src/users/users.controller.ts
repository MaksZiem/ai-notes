import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
import { TokenResponseDto } from './dtos/token-response.dto';
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
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Zwróć dane zalogowanego użytkownika',
    description:
      'Na podstawie tokenu JWT odczytuje ID użytkownika z payload i zwraca pełny rekord z bazy.',
  })
  @ApiUnauthorizedResponse({
    description: 'Brak lub nieważny token JWT',
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
      'Tworzy konto, hashuje hasło algorytmem scrypt i zwraca JWT access_token gotowy do użycia.',
  })
  @ApiCreatedResponse({
    description: 'Konto utworzone, zwraca token JWT',
    type: TokenResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Nieprawidłowe dane lub e-mail jest już zajęty (kod EMAIL_IN_USE)',
    type: BadRequestErrorDto,
  })
  signUp(@Body() body: CreateUserDto) {
    return this.authService.signup(
      body.email,
      body.password,
      body.name,
      body.surname,
    );
  }

  @Post('/signin')
  @ApiOperation({
    summary: 'Logowanie użytkownika',
    description: 'Weryfikuje hasło i zwraca JWT access_token ważny 7 dni.',
  })
  @ApiCreatedResponse({
    description: 'Zalogowano, zwraca token JWT',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Nieprawidłowy e-mail lub hasło (kod INVALID_CREDENTIALS)',
    type: UnauthorizedErrorDto,
  })
  signin(@Body() body: SigninDto) {
    return this.authService.signin(body.email, body.password);
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Usuń użytkownika po ID' })
  @ApiParam({
    name: 'id',
    example: 3,
    description: 'ID użytkownika do usunięcia',
  })
  @ApiNotFoundResponse({
    description: 'Użytkownik nie znaleziony',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Usunięty użytkownik', type: User })
  @ApiBearerAuth(BEARER_AUTH)
  @ApiUnauthorizedResponse({
    description: 'Brak tokenu lub token nieprawidłowy',
    type: UnauthorizedErrorDto,
  })
  @ApiForbiddenResponse({
    description: 'Wymagana rola admina (kod ADMIN_REQUIRED)',
    type: ForbiddenErrorDto,
  })
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Patch('/:id')
  @ApiBearerAuth(BEARER_AUTH)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Zaktualizuj dane użytkownika',
    description: 'Pola pominięte w body pozostają bez zmian (partial update).',
  })
  @ApiParam({
    name: 'id',
    example: 3,
    description: 'ID użytkownika do aktualizacji',
  })
  @ApiNotFoundResponse({
    description: 'Użytkownik nie znaleziony',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Zaktualizowany użytkownik', type: User })
  @ApiUnauthorizedResponse({
    description: 'Brak tokenu lub token nieprawidłowy',
    type: UnauthorizedErrorDto,
  })
  @ApiForbiddenResponse({
    description:
      'Można edytować tylko własne konto, a rolę zmienia tylko admin',
    type: ForbiddenErrorDto,
  })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isSelf = currentUser.id === id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException();
    }
    if (!isAdmin && body.role !== undefined) {
      throw new ForbiddenException();
    }
    return this.usersService.update(id, body);
  }
}
