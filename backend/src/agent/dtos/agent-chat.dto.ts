import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class AgentChatDto {
  @ApiProperty({
    example: 'Utwórz notatkę z planem spotkania w projekcie Redesign',
    description: 'Polecenie dla agenta',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Notatka otwarta w edytorze, jako kontekst',
  })
  @IsOptional()
  @IsInt()
  noteId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Projekt otwarty w aplikacji, jako kontekst',
  })
  @IsOptional()
  @IsInt()
  projectId?: number;
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
