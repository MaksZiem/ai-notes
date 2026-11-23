import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  TooManyRequestsErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { SESSION_AUTH } from 'src/common/swagger/swagger.setup';
import { AgentChatResponseDto } from './dtos/agent-chat.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { AgentService } from './agent.service';
import { AgentChatDto } from './dtos/agent-chat.dto';
import { errorBody } from '../common/error-body';

@UseGuards(AuthGuard)
@ApiTags('agent')
@ApiCookieAuth(SESSION_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak lub nieważne cookie sesji',
  type: UnauthorizedErrorDto,
})
@ApiTooManyRequestsResponse({
  description: 'Wyczerpany limit zapytań do AI (kod AI_QUOTA_EXCEEDED)',
  type: TooManyRequestsErrorDto,
})
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  @ApiCreatedResponse({
    description: 'Odpowiedź agenta i wykonane kroki',
    type: AgentChatResponseDto,
  })
  @ApiOperation({
    summary: 'Wydaj polecenie agentowi',
    description:
      'Agent sam wybiera narzędzia (wyszukiwanie, odczyt, tworzenie i edycja notatek oraz projektów) i działa w imieniu zalogowanego użytkownika, z jego uprawnieniami.',
  })
  @ApiBadRequestResponse({
    description: 'Brak polecenia (kod MESSAGE_REQUIRED)',
    type: BadRequestErrorDto,
  })
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
