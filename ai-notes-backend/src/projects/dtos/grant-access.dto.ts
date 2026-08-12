import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { AccessLevel } from 'src/enums/access-level.enum';

export class GrantAccessDto {
  @ApiProperty({
    example: 7,
    description: 'ID użytkownika, któremu nadajemy lub aktualizujemy dostęp',
  })
  @IsInt()
  userId: number;

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