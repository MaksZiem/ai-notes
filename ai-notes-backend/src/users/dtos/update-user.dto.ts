import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from 'src/enums/user-role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'nowy.email@example.com',
    description: 'Nowy adres e-mail użytkownika',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'User',
    description: 'Nowa rola',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'NoweHaslo99!',
    description: 'Nowe hasło — zostanie ponownie zahashowane',
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(24)
  password?: string;
}
