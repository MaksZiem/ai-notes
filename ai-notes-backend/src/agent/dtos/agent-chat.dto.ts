import { IsInt, IsOptional, IsString } from 'class-validator';

export class AgentChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsInt()
  noteId?: number;

  @IsOptional()
  @IsInt()
  projectId?: number;
}
