import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Redesign v2',
    description: 'Nowa nazwa projektu',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Zaktualizowany opis projektu po zmianie zakresu prac.',
    description: 'Nowy opis projektu',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '#6366f1',
    description: 'Nowy kolor projektu w formacie hex',
  })
  @IsString()
  @IsOptional()
  color?: string;
}