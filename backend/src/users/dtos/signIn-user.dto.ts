import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SigninDto {
  @ApiProperty({
    example: 'jan.kowalski@example.com',
    description: 'Adres e-mail użytkownika',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Tajne123!',
    description:
      'Hasło użytkownika (min. 1 znak); przechowywane jako hash scrypt',
  })
  @IsString()
  password: string;
}
