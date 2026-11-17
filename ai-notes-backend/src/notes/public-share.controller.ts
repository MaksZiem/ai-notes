import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ForbiddenErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
import { Note } from './entities/note.entity';
import { NoteMember } from './entities/note-member.entity';
import { SharedNoteDto } from './dtos/note-response.dto';
import { NotesService } from './notes.service';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';

@ApiTags('shared-notes')
@Controller('shared')
export class PublicShareController {
  constructor(private readonly notesService: NotesService) {}

  // ──────────────────────────────────────────────
  // GET /shared/:token — bez logowania
  // ──────────────────────────────────────────────
  @Get(':token')
  @ApiOperation({ summary: 'Podgląd notatki po tokenie (bez konta)' })
  @ApiParam({
    name: 'token',
    example: 'a1b2c3...',
    description: 'Token z linku udostępniania',
  })
  @ApiOkResponse({
    description: 'Notatka i poziom dostępu linku',
    type: SharedNoteDto,
  })
  @ApiForbiddenResponse({
    description:
      'Link jest nieważny lub wygasł (kody SHARE_LINK_INVALID, SHARE_LINK_EXPIRED)',
    type: ForbiddenErrorDto,
  })
  getSharedNote(@Param('token') token: string) {
    return this.notesService.getSharedNote(token);
  }

  // ──────────────────────────────────────────────
  // PATCH /shared/:token — bez logowania, wymaga accessLevel EDIT na linku
  // ──────────────────────────────────────────────
  @Patch(':token')
  @ApiOperation({ summary: 'Edycja notatki po tokenie (jeśli link ma EDIT)' })
  @ApiParam({
    name: 'token',
    example: 'a1b2c3...',
    description: 'Token z linku udostępniania',
  })
  @ApiOkResponse({ description: 'Zaktualizowana notatka', type: Note })
  @ApiBadRequestResponse({
    description: 'Nieprawidłowe dane wejściowe',
    type: BadRequestErrorDto,
  })
  @ApiForbiddenResponse({
    description:
      'Link jest nieważny, wygasł lub pozwala tylko na odczyt (kody SHARE_LINK_INVALID, SHARE_LINK_EXPIRED, SHARE_LINK_READ_ONLY)',
    type: ForbiddenErrorDto,
  })
  updateSharedNote(@Param('token') token: string, @Body() body: UpdateNoteDto) {
    return this.notesService.updateSharedNote(token, body);
  }

  // ──────────────────────────────────────────────
  // POST /shared/:token/claim — wymaga zalogowania
  // Zamienia dostęp z linku na trwały NoteMember dla zalogowanego usera
  // ──────────────────────────────────────────────
  @Post(':token/claim')
  @UseGuards(AuthGuard)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Zamień dostęp z linku na trwały dostęp konta',
    description: 'Wywołaj po zalogowaniu/rejestracji, mając token w URL.',
  })
  @ApiParam({
    name: 'token',
    example: 'a1b2c3...',
    description: 'Token z linku udostępniania',
  })
  @ApiCreatedResponse({
    description: 'Trwały dostęp do notatki',
    type: NoteMember,
  })
  @ApiUnauthorizedResponse({
    description: 'Brak tokenu lub token nieprawidłowy',
    type: UnauthorizedErrorDto,
  })
  @ApiForbiddenResponse({
    description:
      'Link jest nieważny lub wygasł (kody SHARE_LINK_INVALID, SHARE_LINK_EXPIRED)',
    type: ForbiddenErrorDto,
  })
  claim(@Param('token') token: string, @CurrentUser() user: User) {
    return this.notesService.claimShareLink(token, user.id);
  }
}
