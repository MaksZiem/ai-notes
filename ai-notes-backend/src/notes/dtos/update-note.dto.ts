import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateNoteDto {
  @ApiPropertyOptional({
    example: 'Wymagania funkcjonalne v2',
    description: 'Nowy tytuł notatki',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Zaktualizowana treść po przeglądzie zespołu.',
    description: 'Nowa treść notatki',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: ['backend', 'auth', 'oauth'],
    description: 'Słowa kluczowe ułatwiające wyszukiwanie notatki',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({
    example: '#6366f1',
    description: 'Kolor notatki w formacie hex',
  })
  @IsString()
  @IsOptional()
  color?: string;
}
