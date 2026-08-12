import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Wymagania funkcjonalne',
    description: 'Tytuł notatki — krótki identyfikator widoczny na liście',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example:
      'System powinien umożliwiać logowanie przez OAuth2 oraz klasyczne hasło.',
    description: 'Treść notatki w formacie plain-text lub Markdown',
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

  @ApiPropertyOptional({
    example: 1,
    description:
      'ID projektu nadrzędnego — jeśli pominięte, notatka jest prywatna (bez projektu)',
  })
  @IsInt()
  @IsOptional()
  projectId?: number;
}
