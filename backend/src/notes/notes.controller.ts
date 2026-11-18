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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ForbiddenErrorDto,
  NotFoundErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
import { Note } from './entities/note.entity';
import { NoteMember } from './entities/note-member.entity';
import { UserNotePreference } from './entities/note-user-preference.entity';
import { NotesService } from './notes.service';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { GrantAccessDto } from 'src/projects/dtos/grant-access.dto';

@ApiTags('notes')
@ApiBearerAuth(BEARER_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak tokenu lub token nieprawidłowy',
  type: UnauthorizedErrorDto,
})
@UseGuards(AuthGuard)
@Controller('projects/:projectId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

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
  @ApiForbiddenResponse({
    description: 'Brak dostępu do projektu',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Projekt nie znaleziony',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Notatki projektu', type: Note, isArray: true })
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
  @ApiForbiddenResponse({
    description: 'Brak dostępu do notatki',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka lub projekt nie znaleziony',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Notatka', type: Note })
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.findOne(id, projectId, user.id, user.role);
  }

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
  @ApiBadRequestResponse({
    description: 'Błąd walidacji body',
    type: BadRequestErrorDto,
  })
  @ApiForbiddenResponse({
    description: 'Niewystarczający poziom dostępu (wymagany EDIT)',
    type: ForbiddenErrorDto,
  })
  @ApiCreatedResponse({ description: 'Utworzona notatka', type: Note })
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: CreateNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.create(body, user.id, user.role, projectId);
  }

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
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.notesService.update(id, body, projectId, user.id, user.role);
  }

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
  @ApiForbiddenResponse({
    description: 'Niewystarczający poziom dostępu (wymagany DELETE)',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Notatka nie znaleziona',
    type: NotFoundErrorDto,
  })
  @ApiOkResponse({ description: 'Usunięta notatka', type: Note })
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.remove(id, projectId, user.id, user.role);
  }

  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin notatki (per-user)' })
  @ApiParam({ name: 'projectId', example: 1, description: 'ID projektu' })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiOkResponse({
    description: 'Preferencje użytkownika dla notatki',
    type: UserNotePreference,
  })
  togglePin(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.togglePin(id, projectId, user.id, user.role);
  }

  @Patch(':id/favourite')
  @ApiOperation({ summary: 'Toggle favourite notatki (per-user)' })
  @ApiParam({ name: 'projectId', example: 1, description: 'ID projektu' })
  @ApiParam({ name: 'id', example: 5, description: 'ID notatki' })
  @ApiOkResponse({
    description: 'Preferencje użytkownika dla notatki',
    type: UserNotePreference,
  })
  toggleFavourite(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.toggleFavourite(id, projectId, user.id, user.role);
  }

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
  @ApiForbiddenResponse({
    description: 'Brak dostępu do notatki',
    type: ForbiddenErrorDto,
  })
  @ApiOkResponse({
    description: 'Członkowie notatki z danymi użytkownika',
    type: NoteMember,
    isArray: true,
  })
  listMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notesService.listMembers(id, projectId, user.id, user.role);
  }

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
  @ApiForbiddenResponse({
    description: 'Tylko właściciel projektu lub admin',
    type: ForbiddenErrorDto,
  })
  @ApiCreatedResponse({
    description: 'Wpis dostępu do notatki',
    type: NoteMember,
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
  @ApiForbiddenResponse({
    description: 'Tylko właściciel projektu lub admin',
    type: ForbiddenErrorDto,
  })
  @ApiOkResponse({ description: 'Dostęp odebrany' })
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
