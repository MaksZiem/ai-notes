import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Redesign strony głównej',
    description: 'Nazwa projektu — widoczna na liście projektów',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Projekt obejmuje przeprojektowanie UI i migrację na nowy stos technologiczny.',
    description: 'Opcjonalny opis projektu',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '#6366f1',
    description: 'Kolor projektu w formacie hex',
  })
  @IsString()
  @IsOptional()
  color?: string;
}