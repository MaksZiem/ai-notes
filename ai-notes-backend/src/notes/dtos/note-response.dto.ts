import { ApiProperty } from '@nestjs/swagger';
import { AccessLevel } from 'src/enums/access-level.enum';
import { Note } from '../entities/note.entity';

export class NoteWithAccessDto extends Note {
  @ApiProperty({
    enum: AccessLevel,
    description: 'Poziom dostępu zalogowanego użytkownika do notatki',
  })
  accessLevel: AccessLevel;
}

export class AskNotesDto {
  @ApiProperty({
    example: 'Jakie mamy wymagania dotyczące logowania?',
    description: 'Pytanie do własnych notatek',
  })
  question: string;
}

export class NoteSourceDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'Wymagania funkcjonalne' })
  title: string;
}

export class RagChatResponseDto {
  @ApiProperty({ description: 'Odpowiedź oparta na treści notatek' })
  answer: string;

  @ApiProperty({
    description: 'Notatki, na których oparto odpowiedź',
    type: () => NoteSourceDto,
    isArray: true,
  })
  sources: NoteSourceDto[];
}

export class ReindexResponseDto {
  @ApiProperty({ description: 'Liczba przeliczonych notatek', example: 12 })
  updated: number;
}

export class NoteSummaryResponseDto {
  @ApiProperty({ description: 'Krótkie streszczenie notatki' })
  summary: string;
}

export class SharedNoteDto {
  @ApiProperty({ type: () => Note })
  note: Note;

  @ApiProperty({
    enum: AccessLevel,
    description: 'Poziom dostępu nadany przez link',
  })
  accessLevel: AccessLevel;
}
