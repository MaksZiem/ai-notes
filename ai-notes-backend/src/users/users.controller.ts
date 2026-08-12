import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Auth & Users')
@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  // ──────────────────────────────────────────────
  // GET /auth/whoami
  // ──────────────────────────────────────────────
  @Get('/context')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Zwróć dane zalogowanego użytkownika',
    description:
      'Na podstawie tokenu JWT odczytuje ID użytkownika z payload i zwraca pełny rekord z bazy.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dane bieżącego użytkownika',
    type: UserDto,
  })
  @ApiResponse({ status: 401, description: 'Brak lub nieważny token JWT' })
  async getContext(@CurrentUser() user: User) {
    const found = await this.usersService.findOne(user.id);
    return plainToInstance(UserDto, found, { excludeExtraneousValues: true });
  }

  // ──────────────────────────────────────────────
  // POST /auth/signup
  // ──────────────────────────────────────────────
  @Post('/signup')
  @ApiOperation({
    summary: 'Rejestracja nowego użytkownika',
    description:
      'Tworzy konto, hashuje hasło algorytmem scrypt i zwraca JWT access_token gotowy do użycia.',
  })
  @ApiResponse({
    status: 201,
    description: 'Konto utworzone — zwraca JWT access_token',
    schema: { example: { access_token: 'eyJhbGci...' } },
  })
  @ApiResponse({ status: 400, description: 'Podany e-mail jest już zajęty' })
  signUp(@Body() body: CreateUserDto) {
    return this.authService.signup(body.email, body.password, body.name, body.surname);
  }

  // ──────────────────────────────────────────────
  // POST /auth/signin
  // ──────────────────────────────────────────────
  @Post('/signin')
  @ApiOperation({
    summary: 'Logowanie użytkownika',
    description: 'Weryfikuje hasło i zwraca JWT access_token ważny 7 dni.',
  })
  @ApiResponse({
    status: 200,
    description: 'Zalogowano pomyślnie — zwraca JWT access_token',
    schema: { example: { access_token: 'eyJhbGci...' } },
  })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe hasło' })
  @ApiResponse({
    status: 404,
    description: 'Użytkownik o podanym e-mailu nie istnieje',
  })
  signin(@Body() body: SigninDto) {
    return this.authService.signin(body.email, body.password);
  }

  // ──────────────────────────────────────────────
  // DELETE /auth/:id
  // ──────────────────────────────────────────────
  @Delete('/:id')
  @ApiOperation({ summary: 'Usuń użytkownika po ID' })
  @ApiParam({
    name: 'id',
    example: 3,
    description: 'ID użytkownika do usunięcia',
  })
  @ApiResponse({ status: 200, description: 'Użytkownik usunięty' })
  @ApiResponse({ status: 404, description: 'Użytkownik nie znaleziony' })
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  // ──────────────────────────────────────────────
  // PATCH /auth/:id
  // ──────────────────────────────────────────────
  @Patch('/:id')
  @ApiOperation({
    summary: 'Zaktualizuj dane użytkownika',
    description: 'Pola pominięte w body pozostają bez zmian (partial update).',
  })
  @ApiParam({
    name: 'id',
    example: 3,
    description: 'ID użytkownika do aktualizacji',
  })
  @ApiResponse({
    status: 200,
    description: 'Użytkownik zaktualizowany',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'Użytkownik nie znaleziony' })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(id, body);
  }
}
