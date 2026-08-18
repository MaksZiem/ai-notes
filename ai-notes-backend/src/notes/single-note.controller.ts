import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { GrantAccessDto } from 'src/projects/dtos/grant-access.dto';
import { AiService } from 'src/ai/ai.service';
import { CreateShareLinkDto } from './dtos/create-share-link.dto';

@ApiTags('Notes')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('notes')
export class SingleNoteController {
  constructor(
    private readonly notesService: NotesService,
    private readonly aiService: AiService,
  ) {}

  // ──────────────────────────────────────────────
  // GET /notes
  // ──────────────────────────────────────────────
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
  @ApiResponse({ status: 200, description: 'Tablica notatek' })
  findAll(
    @CurrentUser() user: User,
    @Query('pinned', new DefaultValuePipe(false), ParseBoolPipe)
    pinned?: boolean,
    @Query('favourite', new DefaultValuePipe(false), ParseBoolPipe)
    favourite?: boolean,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
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

  // ──────────────────────────────────────────────
  // POST /notes
  // ──────────────────────────────────────────────
  @Post()
  @ApiOperation({
    summary: 'Utwórz nową notatkę (prywatną lub w projekcie)',
    description:
      'Jeśli body zawiera projectId, notatka zostaje przypisana do projektu (wymagany EDIT). ' +
      'Bez projectId — notatka prywatna, właścicielem staje się caller.',
  })
  @ApiResponse({ status: 201, description: 'Notatka utworzona' })
  @ApiResponse({ status: 400, description: 'Błąd walidacji body' })
  @ApiResponse({
    status: 403,
    description: 'Niewystarczający poziom dostępu do projektu',
  })
  create(@Body() body: CreateNoteDto, @CurrentUser() user: User) {
    return this.notesService.create(body, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // GET /notes/search
  // (musi być zadeklarowane przed GET /notes/:id, inaczej Nest
  // potraktuje "search" jako :id)
  // ──────────────────────────────────────────────
  @Get('search')
  @ApiOperation({ summary: 'Wyszukiwanie semantyczne notatek (AI)' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  async semanticSearch(
    @Query('q') query: string,
    @CurrentUser() user: User,
    @Query('projectId', new ParseIntPipe({ optional: true }))
    projectId?: number,
  ) {
    if (!query?.trim()) return [];
    return this.notesService.semanticSearch(
      query,
      user.id,
      user.role,
      projectId,
    );
  }

  // ──────────────────────────────────────────────
  // POST /notes/reindex
  // ──────────────────────────────────────────────
  @Post('reindex')
  @ApiOperation({
    summary:
      'Przelicz embeddingi wszystkich dostępnych notatek (jednorazowy backfill)',
  })
  async reindex(@CurrentUser() user: User) {
    return this.notesService.reindexEmbeddings(user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // POST /notes/chat
  // ──────────────────────────────────────────────
  @Post('chat')
  @ApiOperation({ summary: 'Zadaj pytanie do własnych notatek (RAG chat)' })
  async chat(@Body('question') question: string, @CurrentUser() user: User) {
    if (!question?.trim()) {
      throw new BadRequestException('Brak pytania');
    }
    return this.notesService.ragChat(question, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // GET /notes/:id
  // ──────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({
    summary: 'Pobierz notatkę po ID',
    description:
      'Działa dla notatek prywatnych i projektowych. ' +
      'Dostęp: owner notatki / admin / NoteMember / dostęp przez projekt.',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({ status: 200, description: 'Dane notatki' })
  @ApiResponse({ status: 403, description: 'Brak dostępu' })
  @ApiResponse({ status: 404, description: 'Notatka nie znaleziona' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.notesService.findOne(id, null, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // POST /notes/:id/summarize
  // ──────────────────────────────────────────────
  @Post(':id/summarize')
  @ApiOperation({ summary: 'Wygeneruj krótkie streszczenie notatki' })
  @ApiParam({ name: 'id', example: 5 })
  async summarize(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const note = await this.notesService.findOne(id, null, user.id, user.role);
    if (!note.content?.trim()) {
      throw new BadRequestException('Notatka jest pusta');
    }
    const summary = await this.aiService.summarizeText(note.content);
    return { summary };
  }

  // ──────────────────────────────────────────────
  // PATCH /notes/:id
  // ──────────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({
    summary: 'Zaktualizuj notatkę',
    description: 'Wymaga EDIT. Pola pominięte pozostają bez zmian.',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({ status: 200, description: 'Notatka zaktualizowana' })
  @ApiResponse({ status: 403, description: 'Niewystarczający poziom dostępu' })
  @ApiResponse({ status: 404, description: 'Notatka nie znaleziona' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.update(id, body, null, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // DELETE /notes/:id
  // ──────────────────────────────────────────────
  @Delete(':id')
  @ApiOperation({ summary: 'Usuń notatkę', description: 'Wymaga DELETE.' })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({ status: 200, description: 'Notatka usunięta' })
  @ApiResponse({ status: 403, description: 'Niewystarczający poziom dostępu' })
  @ApiResponse({ status: 404, description: 'Notatka nie znaleziona' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.notesService.remove(id, null, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // PATCH /notes/:id/pin
  // ──────────────────────────────────────────────
  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin notatki (per-user)' })
  @ApiParam({ name: 'id', example: 5 })
  @ApiResponse({ status: 200, description: 'Stan pinu zaktualizowany' })
  togglePin(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.notesService.togglePin(id, null, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // PATCH /notes/:id/favourite
  // ──────────────────────────────────────────────
  @Patch(':id/favourite')
  @ApiOperation({ summary: 'Toggle favourite notatki (per-user)' })
  @ApiParam({ name: 'id', example: 5 })
  @ApiResponse({ status: 200, description: 'Stan ulubionego zaktualizowany' })
  toggleFavourite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.toggleFavourite(id, null, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // GET /notes/:id/members
  // ──────────────────────────────────────────────
  @Get(':id/members')
  @ApiOperation({ summary: 'Lista członków notatki' })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({ status: 200, description: 'Lista NoteMember' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do notatki' })
  listMembers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.listMembers(id, null, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // POST /notes/:id/members
  // ──────────────────────────────────────────────
  @Post(':id/members')
  @ApiOperation({
    summary: 'Nadaj lub zaktualizuj bezpośredni dostęp do notatki',
    description:
      'Notatka prywatna: tylko owner notatki lub admin. ' +
      'Notatka projektowa: tylko owner projektu lub admin.',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({ status: 201, description: 'Dostęp nadany / zaktualizowany' })
  @ApiResponse({
    status: 403,
    description: 'Brak uprawnień do zarządzania dostępem',
  })
  grantAccess(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: GrantAccessDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.grantAccess(id, null, user.id, user.role, body);
  }

  // ──────────────────────────────────────────────
  // DELETE /notes/:id/members/:userId
  // ──────────────────────────────────────────────
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Odbierz bezpośredni dostęp do notatki' })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiParam({ name: 'userId', example: 7, description: 'ID użytkownika' })
  @ApiResponse({ status: 200, description: 'Dostęp odebrany' })
  @ApiResponse({ status: 403, description: 'Brak uprawnień' })
  revokeAccess(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
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

  // ──────────────────────────────────────────────
  // POST /notes/:id/share-links
  // ──────────────────────────────────────────────
  @Post(':id/share-links')
  @ApiOperation({ summary: 'Utwórz link do udostępnienia notatki bez konta' })
  @ApiParam({ name: 'id', example: 5 })
  createShareLink(
    @Param('id', ParseIntPipe) id: number,
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

  // ──────────────────────────────────────────────
  // GET /notes/:id/share-links
  // ──────────────────────────────────────────────
  @Get(':id/share-links')
  @ApiOperation({ summary: 'Lista aktywnych linków udostępniania notatki' })
  @ApiParam({ name: 'id', example: 5 })
  listShareLinks(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.listShareLinks(id, null, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // DELETE /notes/:id/share-links/:linkId
  // ──────────────────────────────────────────────
  @Delete(':id/share-links/:linkId')
  @ApiOperation({ summary: 'Odwołaj link udostępniania' })
  @ApiParam({ name: 'id', example: 5 })
  @ApiParam({ name: 'linkId', example: 3 })
  revokeShareLink(
    @Param('id', ParseIntPipe) id: number,
    @Param('linkId', ParseIntPipe) linkId: number,
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
