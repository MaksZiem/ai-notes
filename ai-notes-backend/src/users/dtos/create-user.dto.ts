import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'jan.kowalski@example.com',
    description: 'Adres e-mail użytkownika — musi być unikalny w systemie',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Jan',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Kowalski',
  })
  @IsString()
  surname: string;

  @ApiProperty({
    example: 'Tajne123!',
    description:
      'Hasło użytkownika (min. 1 znak); przechowywane jako hash scrypt',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(24)
  password: string;
}
