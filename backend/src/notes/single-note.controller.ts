import { ParseIdPipe } from 'src/common/pipes/parse-id.pipe';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ForbiddenErrorDto,
  NotFoundErrorDto,
  TooManyRequestsErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { SESSION_AUTH } from 'src/common/swagger/swagger.setup';
import { Note } from './entities/note.entity';
import { NoteMember } from './entities/note-member.entity';
import { NoteShareLink } from './entities/note-share-link.entity';
import { UserNotePreference } from './entities/note-user-preference.entity';
import {
  AskNotesDto,
  NoteSummaryResponseDto,
  NoteWithAccessDto,
  RagChatResponseDto,
  ReindexResponseDto,
} from './dtos/note-response.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { MoveNoteDto } from './dtos/move-note.dto';
import { GrantAccessDto } from 'src/projects/dtos/grant-access.dto';
import { AiService } from 'src/ai/ai.service';
import { CreateShareLinkDto } from './dtos/create-share-link.dto';
import { errorBody } from '../common/error-body';

@ApiTags('notes')
@ApiCookieAuth(SESSION_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak lub nieważne cookie sesji',
  type: UnauthorizedErrorDto,
})
@UseGuards(AuthGuard)
@Controller('notes')
export class SingleNoteController {
  constructor(
    private readonly notesService: NotesService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista wszystkich notatek użytkownika',
    description:
      'Zwraca notatki z wszystkich projektów użytkownika oraz notatki prywatne (bez projektu). ' +
      'Admin widzi wszystkie notatki w systemie. ' +
      'Opcjonalny parametr limit ogranicza liczbę zwracanych wyników (domyślnie bez limitu).',
  })
  @ApiQuery({ name: 'pinned', required: false, type: Boolean })
  @ApiQuery({ name: 'favourite', required: false, type: Boolean })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maksymalna liczba zwracanych notatek',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Fraza wyszukiwania — szuka w tytule, treści i słowach kluczowych',
  })
  @ApiOkResponse({
    description: 'Notatki użytkownika z projektem',
    type: Note,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: User,
    @Query('pinned', new DefaultValuePipe(false), ParseBoolPipe)
    pinned?: boolean,
    @Query('favourite', new DefaultValuePipe(false), ParseBoolPipe)
    favourite?: boolean,
    @Query('limit', new ParseIdPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
  ) {
    return this.notesService.findAllNotes(
      user.id,
      user.role,
      { pinned, favourite },
      limit || undefined,
      search || undefined,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Utwórz nową notatkę (prywatną lub w projekcie)',
    description:
      'Jeśli body zawiera projectId, notatka zostaje przypisana do projektu (wymagany EDIT). ' +
      'Bez projectId — notatka prywatna, właścicielem staje się caller.',
  })
  @ApiBadRequestResponse({
    description: 'Błąd walidacji body',
    type: BadRequestErrorDto,
  })
  @ApiForbiddenResponse({
    description: 'Niewystarczający poziom dostępu do projektu',
    type: ForbiddenErrorDto,
  })
  @ApiCreatedResponse({ description: 'Utworzona notatka', type: Note })
  create(@Body() body: CreateNoteDto, @CurrentUser() user: User) {
    return this.notesService.create(body, user.id, user.role);
  }

  @Get('search')
  @ApiOperation({ summary: 'Wyszukiwanie semantyczne notatek (AI)' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiOkResponse({
    description: 'Do 15 najbardziej podobnych notatek',
    type: Note,
    isArray: true,
  })
  @ApiTooManyRequestsResponse({
    description: 'Wyczerpany limit zapytań do AI (kod AI_QUOTA_EXCEEDED)',
    type: TooManyRequestsErrorDto,
  })
  async semanticSearch(
    @Query('q') query: string,
    @CurrentUser() user: User,
    @Query('projectId', new ParseIdPipe({ optional: true }))
    projectId?: string,
  ) {
    if (!query?.trim()) return [];
    return this.notesService.semanticSearch(
      query,
      user.id,
      user.role,
      projectId,
    );
  }

  @Post('reindex')
  @ApiOperation({
    summary:
      'Przelicz embeddingi wszystkich dostępnych notatek (jednorazowy backfill)',
  })
  @ApiCreatedResponse({
    description: 'Liczba przeliczonych notatek',
    type: ReindexResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Wyczerpany limit zapytań do AI (kod AI_QUOTA_EXCEEDED)',
    type: TooManyRequestsErrorDto,
  })
  async reindex(@CurrentUser() user: User) {
    return this.notesService.reindexEmbeddings(user.id, user.role);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Zadaj pytanie do własnych notatek (RAG chat)' })
  @ApiCreatedResponse({
    description: 'Odpowiedź ze źródłami',
    type: RagChatResponseDto,
  })
  @ApiBody({ type: AskNotesDto })
  @ApiBadRequestResponse({
    description: 'Brak pytania (kod QUESTION_REQUIRED)',
    type: BadRequestErrorDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Wyczerpany limit zapytań do AI (kod AI_QUOTA_EXCEEDED)',
    type: TooManyRequestsErrorDto,
  })
  async chat(@Body('question') question: string, @CurrentUser() user: User) {
    if (!question?.trim()) {
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'QUESTION_REQUIRED',
          'Question is required',
        ),
      );
    }
    return this.notesService.ragChat(question, user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Pobierz notatkę po ID',
    description:
      'Działa dla notatek prywatnych i projektowych. ' +
      'Dostęp: owner notatki / admin / NoteMember / dostęp przez projekt.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiForbiddenResponse({
    description: 'Brak dostępu',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka nie znaleziona',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({
    description: 'Notatka z poziomem dostępu',
    type: NoteWithAccessDto,
  })
  async findOne(
    @Param('id', ParseIdPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const [note, accessLevel] = await Promise.all([
      this.notesService.findOne(id, null, user.id, user.role),
      this.notesService.getAccessLevel(id, null, user.id, user.role),
    ]);
    return { ...note, accessLevel };
  }

  @Post(':id/summarize')
  @ApiOperation({ summary: 'Wygeneruj krótkie streszczenie notatki' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiCreatedResponse({
    description: 'Streszczenie notatki',
    type: NoteSummaryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Notatka jest pusta (kod NOTE_EMPTY)',
    type: BadRequestErrorDto,
  })
  @ApiForbiddenResponse({
    description:
      'Brak dostępu lub niewystarczający poziom dostępu (kody ACCESS_DENIED, ACCESS_LEVEL_REQUIRED)',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka nie istnieje (kod NOTE_NOT_FOUND)',
    type: NotFoundErrorDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Wyczerpany limit zapytań do AI (kod AI_QUOTA_EXCEEDED)',
    type: TooManyRequestsErrorDto,
  })
  async summarize(
    @Param('id', ParseIdPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const note = await this.notesService.findOne(id, null, user.id, user.role);
    if (!note.content?.trim()) {
      throw new BadRequestException(
        errorBody(HttpStatus.BAD_REQUEST, 'NOTE_EMPTY', 'The note is empty'),
      );
    }
    const summary = await this.aiService.summarizeText(note.content);
    return { summary };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Zaktualizuj notatkę',
    description: 'Wymaga EDIT. Pola pominięte pozostają bez zmian.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiForbiddenResponse({
    description: 'Niewystarczający poziom dostępu',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka nie znaleziona',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Zaktualizowana notatka', type: Note })
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body() body: UpdateNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.update(id, body, null, user.id, user.role);
  }

  @Patch(':id/move')
  @ApiOperation({
    summary: 'Przenieś notatkę do innego projektu (lub poza projekty)',
    description:
      'Wymaga DELETE w projekcie, z którego notatka jest zabierana (jeśli obecnie w jakimś jest), ' +
      'oraz EDIT w projekcie docelowym (jeśli projectId nie jest null).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiForbiddenResponse({
    description:
      'Niewystarczający poziom dostępu w projekcie źródłowym lub docelowym',
    type: ForbiddenErrorDto,
  })
  @ApiOkResponse({ description: 'Przeniesiona notatka', type: Note })
  moveNote(
    @Param('id', ParseIdPipe) id: string,
    @Body() body: MoveNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.moveToProject(
      id,
      body.projectId,
      user.id,
      user.role,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Usuń notatkę', description: 'Wymaga DELETE.' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiForbiddenResponse({
    description: 'Niewystarczający poziom dostępu',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka nie znaleziona',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Usunięta notatka', type: Note })
  remove(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: User) {
    return this.notesService.remove(id, null, user.id, user.role);
  }

  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin notatki (per-user)' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiOkResponse({
    description: 'Preferencje użytkownika dla notatki',
    type: UserNotePreference,
  })
  togglePin(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: User) {
    return this.notesService.togglePin(id, null, user.id, user.role);
  }

  @Patch(':id/favourite')
  @ApiOperation({ summary: 'Toggle favourite notatki (per-user)' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiOkResponse({
    description: 'Preferencje użytkownika dla notatki',
    type: UserNotePreference,
  })
  toggleFavourite(
    @Param('id', ParseIdPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notesService.toggleFavourite(id, null, user.id, user.role);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Lista członków notatki' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiForbiddenResponse({
    description: 'Brak dostępu do notatki',
    type: ForbiddenErrorDto,
  })
  @ApiOkResponse({
    description: 'Członkowie notatki z danymi użytkownika',
    type: NoteMember,
    isArray: true,
  })
  listMembers(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: User) {
    return this.notesService.listMembers(id, null, user.id, user.role);
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'Nadaj lub zaktualizuj bezpośredni dostęp do notatki',
    description:
      'Notatka prywatna: tylko owner notatki lub admin. ' +
      'Notatka projektowa: tylko owner projektu lub admin.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiForbiddenResponse({
    description: 'Brak uprawnień do zarządzania dostępem',
    type: ForbiddenErrorDto,
  })
  @ApiCreatedResponse({
    description: 'Wpis dostępu do notatki',
    type: NoteMember,
  })
  grantAccess(
    @Param('id', ParseIdPipe) id: string,
    @Body() body: GrantAccessDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.grantAccess(id, null, user.id, user.role, body);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Odbierz bezpośredni dostęp do notatki' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID użytkownika',
  })
  @ApiForbiddenResponse({
    description: 'Brak uprawnień',
    type: ForbiddenErrorDto,
  })
  @ApiOkResponse({ description: 'Dostęp odebrany' })
  revokeAccess(
    @Param('id', ParseIdPipe) id: string,
    @Param('userId', ParseIdPipe) targetUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.notesService.revokeAccess(
      id,
      null,
      targetUserId,
      user.id,
      user.role,
    );
  }

  @Delete(':id/leave')
  @ApiOperation({
    summary: 'Opuść notatkę udostępnioną Ci przez kogoś innego',
    description:
      'Usuwa Twój bezpośredni dostęp (NoteMember) do notatki. ' +
      'Sama notatka pozostaje nietknięta u właściciela. ' +
      'Właściciel notatki nie może jej w ten sposób opuścić.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiForbiddenResponse({
    description: 'Jesteś właścicielem notatki lub nie masz do niej dostępu',
    type: ForbiddenErrorDto,
  })
  @ApiOkResponse({ description: 'Notatka opuszczona' })
  leaveNote(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: User) {
    return this.notesService.leaveNote(id, null, user.id);
  }

  @Post(':id/share-links')
  @ApiOperation({ summary: 'Utwórz link do udostępnienia notatki bez konta' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiCreatedResponse({ description: 'Utworzony link', type: NoteShareLink })
  @ApiForbiddenResponse({
    description:
      'Brak dostępu lub niewystarczający poziom dostępu (kody ACCESS_DENIED, ACCESS_LEVEL_REQUIRED)',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka nie istnieje (kod NOTE_NOT_FOUND)',
    type: NotFoundErrorDto,
  })
  createShareLink(
    @Param('id', ParseIdPipe) id: string,
    @Body() body: CreateShareLinkDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.createShareLink(
      id,
      null,
      user.id,
      user.role,
      body,
    );
  }

  @Get(':id/share-links')
  @ApiOperation({ summary: 'Lista aktywnych linków udostępniania notatki' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiOkResponse({
    description: 'Aktywne linki',
    type: NoteShareLink,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description:
      'Brak dostępu lub niewystarczający poziom dostępu (kody ACCESS_DENIED, ACCESS_LEVEL_REQUIRED)',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka nie istnieje (kod NOTE_NOT_FOUND)',
    type: NotFoundErrorDto,
  })
  listShareLinks(
    @Param('id', ParseIdPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notesService.listShareLinks(id, null, user.id, user.role);
  }

  @Delete(':id/share-links/:linkId')
  @ApiOperation({ summary: 'Odwołaj link udostępniania' })
  @ApiOkResponse({ description: 'Link odwołany' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID notatki',
  })
  @ApiParam({
    name: 'linkId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID linku udostępniania',
  })
  @ApiForbiddenResponse({
    description:
      'Brak dostępu lub niewystarczający poziom dostępu (kody ACCESS_DENIED, ACCESS_LEVEL_REQUIRED)',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka lub link nie istnieje',
    type: NotFoundErrorDto,
  })
  revokeShareLink(
    @Param('id', ParseIdPipe) id: string,
    @Param('linkId', ParseIdPipe) linkId: string,
    @CurrentUser() user: User,
  ) {
    return this.notesService.revokeShareLink(
      id,
      null,
      linkId,
      user.id,
      user.role,
    );
  }
}
