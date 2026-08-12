import {
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { GrantAccessDto } from 'src/projects/dtos/grant-access.dto';

@ApiTags('Notes')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('projects/:projectId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // ──────────────────────────────────────────────
  // GET /projects/:projectId/notes
  // ──────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Lista notatek projektu',
    description:
      'Zwraca wszystkie notatki należące do danego projektu. ' +
      'Użytkownik musi mieć co najmniej poziom VIEW do projektu (lub być właścicielem/adminem).',
  })
  @ApiParam({
    name: 'projectId',
    example: 1,
    description: 'ID projektu nadrzędnego',
  })
  @ApiResponse({ status: 200, description: 'Tablica notatek' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do projektu' })
  @ApiResponse({ status: 404, description: 'Projekt nie znaleziony' })
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: User,
    @Query('pinned', new DefaultValuePipe(false), ParseBoolPipe)
    pinned?: boolean,
    @Query('favourite', new DefaultValuePipe(false), ParseBoolPipe)
    favourite?: boolean,
  ) {
    return this.notesService.findAllNotesInProject(
      projectId,
      user.id,
      user.role,
      {
        pinned,
        favourite,
      },
    );
  }

  // ──────────────────────────────────────────────
  // GET /projects/:projectId/notes/:id
  // ──────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({
    summary: 'Pobierz notatkę po ID',
    description:
      'Dostęp dwupoziomowy: przez projekt (VIEW na projekcie) LUB bezpośredni wpis NoteMember. ' +
      'Jeśli oba sposoby zawiodą, zwracany jest 403.',
  })
  @ApiParam({
    name: 'projectId',
    example: 1,
    description: 'ID projektu nadrzędnego',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({ status: 200, description: 'Dane notatki' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do notatki' })
  @ApiResponse({
    status: 404,
    description: 'Notatka lub projekt nie znaleziony',
  })
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.findOne(id, projectId, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // POST /projects/:projectId/notes
  // ──────────────────────────────────────────────
  @Post()
  @ApiOperation({
    summary: 'Utwórz nową notatkę w projekcie',
    description: 'Wymaga co najmniej poziomu EDIT w projekcie.',
  })
  @ApiParam({
    name: 'projectId',
    example: 1,
    description: 'ID projektu nadrzędnego',
  })
  @ApiResponse({ status: 201, description: 'Notatka utworzona' })
  @ApiResponse({ status: 400, description: 'Błąd walidacji body' })
  @ApiResponse({
    status: 403,
    description: 'Niewystarczający poziom dostępu (wymagany EDIT)',
  })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: CreateNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.create(body, user.id, user.role, projectId);
  }

  // ──────────────────────────────────────────────
  // PATCH /projects/:projectId/notes/:id
  // ──────────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({
    summary: 'Zaktualizuj notatkę',
    description:
      'Wymaga EDIT na projekcie lub EDIT w bezpośrednim dostępie NoteMember. ' +
      'Pola pominięte w body pozostają bez zmian.',
  })
  @ApiParam({
    name: 'projectId',
    example: 1,
    description: 'ID projektu nadrzędnego',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({ status: 200, description: 'Notatka zaktualizowana' })
  @ApiResponse({ status: 403, description: 'Niewystarczający poziom dostępu' })
  @ApiResponse({ status: 404, description: 'Notatka nie znaleziona' })
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.update(id, body, projectId, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // DELETE /projects/:projectId/notes/:id
  // ──────────────────────────────────────────────
  @Delete(':id')
  @ApiOperation({
    summary: 'Usuń notatkę',
    description:
      'Wymaga DELETE na projekcie lub DELETE w bezpośrednim dostępie NoteMember.',
  })
  @ApiParam({
    name: 'projectId',
    example: 1,
    description: 'ID projektu nadrzędnego',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({ status: 200, description: 'Notatka usunięta' })
  @ApiResponse({
    status: 403,
    description: 'Niewystarczający poziom dostępu (wymagany DELETE)',
  })
  @ApiResponse({ status: 404, description: 'Notatka nie znaleziona' })
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.remove(id, projectId, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // PATCH /projects/:projectId/notes/:id/pin
  // ──────────────────────────────────────────────
  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin notatki (per-user)' })
  @ApiParam({ name: 'projectId', example: 1 })
  @ApiParam({ name: 'id', example: 5 })
  @ApiResponse({ status: 200, description: 'Stan pinu zaktualizowany' })
  togglePin(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.togglePin(id, projectId, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // PATCH /projects/:projectId/notes/:id/favourite
  // ──────────────────────────────────────────────
  @Patch(':id/favourite')
  @ApiOperation({ summary: 'Toggle favourite notatki (per-user)' })
  @ApiParam({ name: 'projectId', example: 1 })
  @ApiParam({ name: 'id', example: 5 })
  @ApiResponse({ status: 200, description: 'Stan ulubionego zaktualizowany' })
  toggleFavourite(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.toggleFavourite(id, projectId, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // GET /projects/:projectId/notes/:id/members
  // ──────────────────────────────────────────────
  @Get(':id/members')
  @ApiOperation({
    summary: 'Lista członków notatki',
    description:
      'Zwraca użytkowników z bezpośrednim dostępem do notatki (NoteMember).',
  })
  @ApiParam({
    name: 'projectId',
    example: 1,
    description: 'ID projektu nadrzędnego',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({
    status: 200,
    description: 'Lista NoteMember z dołączonym obiektem user',
  })
  @ApiResponse({ status: 403, description: 'Brak dostępu do notatki' })
  listMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.listMembers(id, projectId, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // POST /projects/:projectId/notes/:id/members
  // ──────────────────────────────────────────────
  @Post(':id/members')
  @ApiOperation({
    summary: 'Nadaj lub zaktualizuj bezpośredni dostęp do notatki',
    description:
      'Tylko właściciel projektu lub admin może zarządzać dostępem do notatek. ' +
      'Jeśli wpis już istnieje, poziom dostępu zostanie nadpisany.',
  })
  @ApiParam({
    name: 'projectId',
    example: 1,
    description: 'ID projektu nadrzędnego',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiResponse({
    status: 201,
    description: 'Dostęp do notatki nadany / zaktualizowany',
  })
  @ApiResponse({
    status: 403,
    description: 'Tylko właściciel projektu lub admin',
  })
  grantAccess(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: GrantAccessDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.grantAccess(
      id,
      projectId,
      user.id,
      user.role,
      body,
    );
  }

  // ──────────────────────────────────────────────
  // DELETE /projects/:projectId/notes/:id/members/:userId
  // ──────────────────────────────────────────────
  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Odbierz bezpośredni dostęp do notatki',
    description: 'Usuwa wpis NoteMember. Tylko właściciel projektu lub admin.',
  })
  @ApiParam({
    name: 'projectId',
    example: 1,
    description: 'ID projektu nadrzędnego',
  })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiParam({
    name: 'userId',
    example: 7,
    description: 'ID użytkownika, któremu odbieramy dostęp',
  })
  @ApiResponse({ status: 200, description: 'Dostęp odebrany' })
  @ApiResponse({
    status: 403,
    description: 'Tylko właściciel projektu lub admin',
  })
  revokeAccess(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.revokeAccess(
      id,
      projectId,
      targetUserId,
      user.id,
      user.role,
    );
  }
}
