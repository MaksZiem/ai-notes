import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { AgentService } from './agent.service';

@UseGuards(AuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  async chat(@Body('message') message: string, @CurrentUser() user: User) {
    if(!message?.trim()) {
      throw new BadRequestException('Brak wiadomości');
    }
    return this.agentService.run(message, user)
  }
}