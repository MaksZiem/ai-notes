import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class MoveNoteDto {
  @ApiProperty({
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    nullable: true,
    description:
      'ID docelowego projektu, lub null aby przenieść notatkę poza projekty (notatka prywatna)',
  })
  @ValidateIf((o: MoveNoteDto) => o.projectId !== null)
  @IsUUID()
  projectId: string | null;
}
