import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { AgentService } from './agent.service';
import { AgentChatDto } from './dtos/agent-chat.dto';

@UseGuards(AuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  async chat(@Body() body: AgentChatDto, @CurrentUser() user: User) {
    if(!body.message?.trim()) {
      throw new BadRequestException('Brak wiadomości');
    }
    return this.agentService.run(body.message, user, {
      noteId: body.noteId,
      projectId: body.projectId,
    });
  }
}