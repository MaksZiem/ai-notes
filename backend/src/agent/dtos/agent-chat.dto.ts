import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AgentChatDto {
  @ApiProperty({
    example: 'Utwórz notatkę z planem spotkania w projekcie Redesign',
    description: 'Polecenie dla agenta',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Notatka otwarta w edytorze, jako kontekst',
  })
  @IsOptional()
  @IsUUID()
  noteId?: string;

  @ApiPropertyOptional({
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'Projekt otwarty w aplikacji, jako kontekst',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

export class AgentStepDto {
  @ApiProperty({
    description: 'Nazwa użytego narzędzia',
    example: 'create_note',
  })
  tool: string;

  @ApiProperty({
    description: 'Argumenty wywołania',
    type: 'object',
    additionalProperties: true,
  })
  args: Record<string, unknown>;

  @ApiProperty({
    description: 'Wynik narzędzia',
    type: 'object',
    additionalProperties: true,
  })
  result: unknown;
}

export class AgentChatResponseDto {
  @ApiProperty({ description: 'Odpowiedź agenta' })
  answer: string;

  @ApiProperty({
    description: 'Wykonane kroki',
    type: () => AgentStepDto,
    isArray: true,
  })
  steps: AgentStepDto[];
}
