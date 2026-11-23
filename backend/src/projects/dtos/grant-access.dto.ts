import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AccessLevel } from 'src/enums/access-level.enum';

export class GrantAccessDto {
  @ApiProperty({
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID użytkownika, któremu nadajemy lub aktualizujemy dostęp',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    enum: AccessLevel,
    example: AccessLevel.EDIT,
    description:
      'Poziom dostępu: VIEW (odczyt) < EDIT (edycja) < DELETE (usuwanie). ' +
      'Każdy wyższy poziom obejmuje uprawnienia niższych. ' +
      'Domyślnie VIEW, jeśli nie podano.',
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel;
}
