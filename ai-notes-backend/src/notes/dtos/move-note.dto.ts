import { ApiProperty } from '@nestjs/swagger';
import { IsInt, ValidateIf } from 'class-validator';

export class MoveNoteDto {
  @ApiProperty({
    example: 3,
    nullable: true,
    description:
      'ID docelowego projektu, lub null aby przenieść notatkę poza projekty (notatka prywatna)',
  })
  @ValidateIf((o: MoveNoteDto) => o.projectId !== null)
  @IsInt()
  projectId: number | null;
}
