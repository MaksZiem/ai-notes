import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRole } from 'src/enums/user-role.enum';

export class UserDto {
  @ApiProperty({
    example: 1,
    description: 'Unikalny identyfikator użytkownika',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'jan.kowalski@example.com',
    description: 'Adres e-mail',
  })
  @Expose()
  email: string;

  @ApiProperty({ example: 'Jan', description: 'Imię' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Kowalski', description: 'Nazwisko' })
  @Expose()
  surname: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Rola użytkownika w systemie',
  })
  @Expose()
  role: UserRole;
}
