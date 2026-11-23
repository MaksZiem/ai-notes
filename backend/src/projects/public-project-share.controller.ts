import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  NotFoundErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { SESSION_AUTH } from 'src/common/swagger/swagger.setup';
import { ProjectMember } from './entities/project-member.entity';
import { SharedProjectDto } from './dtos/shared-project.dto';
import { ProjectsService } from './projects.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';

@ApiTags('project-invites')
@Controller('project-invites')
export class PublicProjectShareController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Podgląd zaproszenia do projektu po tokenie' })
  @ApiParam({
    name: 'token',
    example: 'a1b2c3...',
    description: 'Token z linku udostępniania',
  })
  @ApiOkResponse({ description: 'Podgląd zaproszenia', type: SharedProjectDto })
  @ApiNotFoundResponse({
    description:
      'Zaproszenie nie istnieje lub zostało odwołane (kody INVITATION_NOT_FOUND, INVITATION_LINK_GONE)',
    type: NotFoundErrorDto,
  })
  getInvite(@Param('token') token: string) {
    return this.projectsService.getSharedProject(token);
  }

  @Post(':token/claim')
  @UseGuards(AuthGuard)
  @ApiCookieAuth(SESSION_AUTH)
  @ApiOperation({
    summary: 'Zaakceptuj zaproszenie do projektu',
    description:
      'Wywołaj po zalogowaniu/rejestracji, mając token w URL. Dodaje trwały dostęp (ProjectMember).',
  })
  @ApiParam({
    name: 'token',
    example: 'a1b2c3...',
    description: 'Token z linku udostępniania',
  })
  @ApiCreatedResponse({
    description: 'Trwały dostęp do projektu',
    type: ProjectMember,
  })
  @ApiUnauthorizedResponse({
    description: 'Brak lub nieważne cookie sesji',
    type: UnauthorizedErrorDto,
  })
  @ApiNotFoundResponse({
    description:
      'Zaproszenie nie istnieje lub zostało odwołane (kody INVITATION_NOT_FOUND, INVITATION_LINK_GONE)',
    type: NotFoundErrorDto,
  })
  claim(@Param('token') token: string, @CurrentUser() user: User) {
    return this.projectsService.claimShareLink(token, user.id);
  }
}
