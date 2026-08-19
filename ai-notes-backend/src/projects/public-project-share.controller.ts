import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';

@ApiTags('Project invites')
@Controller('project-invites')
export class PublicProjectShareController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ──────────────────────────────────────────────
  // GET /project-invites/:token — bez logowania (tylko metadane, bez notatek)
  // ──────────────────────────────────────────────
  @Get(':token')
  @ApiOperation({ summary: 'Podgląd zaproszenia do projektu po tokenie' })
  @ApiParam({ name: 'token', example: 'a1b2c3...' })
  getInvite(@Param('token') token: string) {
    return this.projectsService.getSharedProject(token);
  }

  // ──────────────────────────────────────────────
  // POST /project-invites/:token/claim — wymaga zalogowania
  // ──────────────────────────────────────────────
  @Post(':token/claim')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Zaakceptuj zaproszenie do projektu',
    description:
      'Wywołaj po zalogowaniu/rejestracji, mając token w URL. Dodaje trwały dostęp (ProjectMember).',
  })
  @ApiParam({ name: 'token', example: 'a1b2c3...' })
  claim(@Param('token') token: string, @CurrentUser() user: User) {
    return this.projectsService.claimShareLink(token, user.id);
  }
}
