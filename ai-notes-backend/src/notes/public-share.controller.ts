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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';

@ApiTags('Public share')
@Controller('shared')
export class PublicShareController {
  constructor(private readonly notesService: NotesService) {}

  // ──────────────────────────────────────────────
  // GET /shared/:token — bez logowania
  // ──────────────────────────────────────────────
  @Get(':token')
  @ApiOperation({ summary: 'Podgląd notatki po tokenie (bez konta)' })
  @ApiParam({ name: 'token', example: 'a1b2c3...' })
  getSharedNote(@Param('token') token: string) {
    return this.notesService.getSharedNote(token);
  }

  // ──────────────────────────────────────────────
  // PATCH /shared/:token — bez logowania, wymaga accessLevel EDIT na linku
  // ──────────────────────────────────────────────
  @Patch(':token')
  @ApiOperation({ summary: 'Edycja notatki po tokenie (jeśli link ma EDIT)' })
  @ApiParam({ name: 'token', example: 'a1b2c3...' })
  updateSharedNote(@Param('token') token: string, @Body() body: UpdateNoteDto) {
    return this.notesService.updateSharedNote(token, body);
  }

  // ──────────────────────────────────────────────
  // POST /shared/:token/claim — wymaga zalogowania
  // Zamienia dostęp z linku na trwały NoteMember dla zalogowanego usera
  // ──────────────────────────────────────────────
  @Post(':token/claim')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Zamień dostęp z linku na trwały dostęp konta',
    description: 'Wywołaj po zalogowaniu/rejestracji, mając token w URL.',
  })
  @ApiParam({ name: 'token', example: 'a1b2c3...' })
  claim(@Param('token') token: string, @CurrentUser() user: User) {
    return this.notesService.claimShareLink(token, user.id);
  }
}
