import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const REWRITE_MODES = [
  'fix',
  'improve',
  'shorten',
  'expand',
  'custom',
] as const;

export class PromptDto {
  @ApiProperty({
    example: 'Napisz listę kontrolną wdrożenia aplikacji',
    description: 'Polecenie dla AI',
  })
  prompt: string;
}

export class TextDto {
  @ApiProperty({ description: 'Tekst, który AI ma kontynuować' })
  text: string;
}

export class RewriteDto {
  @ApiProperty({ description: 'Tekst do przepisania' })
  text: string;

  @ApiProperty({
    enum: REWRITE_MODES,
    description:
      'fix: popraw błędy, improve: ulepsz styl, shorten: skróć, expand: rozwiń, custom: według instrukcji',
  })
  mode: (typeof REWRITE_MODES)[number];

  @ApiPropertyOptional({
    description: 'Instrukcja, wymagana dla trybu custom',
    example: 'Zamień na listę punktów',
  })
  instruction?: string;
}

export class ContentDto {
  @ApiProperty({ description: 'Treść notatki' })
  content: string;
}

export class GeneratedTextDto {
  @ApiProperty()
  text: string;
}

export class GeneratedContentDto {
  @ApiProperty({ description: 'Wygenerowana treść notatki w Markdown' })
  content: string;
}

export class ContinuationDto {
  @ApiProperty({ description: 'Dalszy ciąg tekstu' })
  continuation: string;
}

export class RewriteResultDto {
  @ApiProperty({ description: 'Przepisany tekst' })
  result: string;
}

export class TitleDto {
  @ApiProperty({ example: 'Lista kontrolna wdrożenia' })
  title: string;
}

export class SummaryDto {
  @ApiProperty({ description: 'Streszczenie' })
  summary: string;
}

export class KeywordsDto {
  @ApiProperty({ type: [String], example: ['wdrożenie', 'devops'] })
  keywords: string[];
}
