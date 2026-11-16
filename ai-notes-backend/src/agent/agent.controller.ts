import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { AgentService } from './agent.service';
import { AgentChatDto } from './dtos/agent-chat.dto';
import { errorBody } from '../common/error-body';

@UseGuards(AuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  async chat(@Body() body: AgentChatDto, @CurrentUser() user: User) {
    if (!body.message?.trim()) {
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'MESSAGE_REQUIRED',
          'Message is required',
        ),
      );
    }
    return this.agentService.run(body.message, user, {
      noteId: body.noteId,
      projectId: body.projectId,
    });
  }
}
