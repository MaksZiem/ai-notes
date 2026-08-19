import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  forwardRef,
  Get,
  Inject,
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
import { ProjectsService } from './projects.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { GrantAccessDto } from './dtos/grant-access.dto';
import { NotesService } from 'src/notes/notes.service';
import { CreateProjectShareLinkDto } from './dtos/create-project-share-link.dto';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    @Inject(forwardRef(() => NotesService))
    private readonly notesService: NotesService,
  ) {}

  // ──────────────────────────────────────────────
  // GET /projects
  // ──────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Lista projektów bieżącego użytkownika',
    description:
      'Zwraca projekty, których użytkownik jest właścicielem, lub do których ma nadany dostęp jako member. ' +
      'Admin widzi wszystkie projekty w systemie.',
  })
  @ApiResponse({ status: 200, description: 'Tablica projektów' })
  @ApiResponse({ status: 401, description: 'Brak lub nieważny token JWT' })
  findAll(
    @CurrentUser() user: User,
    @Query('pinned', new DefaultValuePipe(false), ParseBoolPipe)
    pinned?: boolean,
    @Query('favourite', new DefaultValuePipe(false), ParseBoolPipe)
    favourite?: boolean,
  ) {
    return this.projectsService.findAllByUser(user.id, user.role, {
      pinned,
      favourite,
    });
  }

  // ──────────────────────────────────────────────
  // GET /projects/recent
  // ──────────────────────────────────────────────
  @Get('recent')
  @ApiOperation({ summary: 'Ostatnio modyfikowane projekty użytkownika' })
  @ApiResponse({ status: 200, description: 'Tablica projektów' })
  findRecent(@CurrentUser() user: User) {
    return this.projectsService.findRecent(user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // GET /projects/recent-notes
  // ──────────────────────────────────────────────
  // @Get('recent-notes')
  // @ApiOperation({ summary: 'Ostatnio modyfikowane notatki użytkownika' })
  // @ApiResponse({ status: 200, description: 'Tablica notatek' })
  // findRecentNotes(
  //   @CurrentUser() user: User,
  //   @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  // ) {
  //   return this.notesService.findRecent(user.id, user.role, limit);
  // }

  // ──────────────────────────────────────────────
  // GET /projects/:id
  // ──────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({
    summary: 'Pobierz projekt po ID',
    description:
      'Dostęp mają: właściciel, admin oraz użytkownicy z co najmniej poziomem VIEW nadanym przez właściciela.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID projektu' })
  @ApiResponse({ status: 200, description: 'Dane projektu' })
  @ApiResponse({ status: 403, description: 'Brak dostępu do projektu' })
  @ApiResponse({ status: 404, description: 'Projekt nie znaleziony' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.projectsService.findOne(id, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // POST /projects
  // ──────────────────────────────────────────────
  @Post()
  @ApiOperation({
    summary: 'Utwórz nowy projekt',
    description:
      'Twórca staje się automatycznie właścicielem projektu (ownerId = id z tokenu JWT).',
  })
  @ApiResponse({ status: 201, description: 'Projekt utworzony' })
  @ApiResponse({ status: 400, description: 'Błąd walidacji body' })
  create(@Body() body: CreateProjectDto, @CurrentUser() user: User) {
    return this.projectsService.create(body, user.id);
  }

  // ──────────────────────────────────────────────
  // PATCH /projects/:id
  // ──────────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({
    summary: 'Zaktualizuj projekt',
    description:
      'Wymaga co najmniej poziomu EDIT. Właściciel i admin mogą edytować zawsze. Pola pominięte w body pozostają bez zmian.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID projektu' })
  @ApiResponse({ status: 200, description: 'Projekt zaktualizowany' })
  @ApiResponse({
    status: 403,
    description: 'Niewystarczający poziom dostępu (wymagany EDIT)',
  })
  @ApiResponse({ status: 404, description: 'Projekt nie znaleziony' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProjectDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.update(id, body, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // DELETE /projects/:id
  // ──────────────────────────────────────────────
  @Delete(':id')
  @ApiOperation({
    summary: 'Usuń projekt',
    description:
      'Może wykonać wyłącznie właściciel projektu lub admin. ' +
      'Usunięcie projektu kaskadowo usuwa wszystkie notatki i wpisy dostępu.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID projektu' })
  @ApiResponse({ status: 200, description: 'Projekt usunięty' })
  @ApiResponse({
    status: 403,
    description: 'Tylko właściciel lub admin może usunąć projekt',
  })
  @ApiResponse({ status: 404, description: 'Projekt nie znaleziony' })
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.projectsService.remove(id, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // GET /projects/:id/pin
  // ──────────────────────────────────────────────
  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin projekt (per-user)' })
  @ApiParam({ name: 'id', example: 1, description: 'ID projektu' })
  @ApiResponse({ status: 200, description: 'Stan pinu zaktualizowany' })
  togglePin(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.projectsService.togglePin(id, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // GET /projects/:id/favourite
  // ──────────────────────────────────────────────
  @Patch(':id/favourite')
  @ApiOperation({ summary: 'Toggle favourite projektu (per-user)' })
  @ApiParam({ name: 'id', example: 1, description: 'ID projektu' })
  @ApiResponse({ status: 200, description: 'Stan ulubionego zaktualizowany' })
  toggleFavourite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.toggleFavourite(id, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // GET /projects/:id/members
  // ──────────────────────────────────────────────
  @Get(':id/members')
  @ApiOperation({
    summary: 'Lista członków projektu',
    description:
      'Zwraca wszystkich użytkowników z nadanym dostępem do projektu wraz z ich poziomem (VIEW/EDIT/DELETE). ' +
      'Właściciel i admin widzą listę zawsze; member z VIEW również.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID projektu' })
  @ApiResponse({
    status: 200,
    description: 'Lista ProjectMember z dołączonym obiektem user',
  })
  @ApiResponse({ status: 403, description: 'Brak dostępu do projektu' })
  listMembers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.listMembers(id, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // POST /projects/:id/members
  // ──────────────────────────────────────────────
  @Post(':id/members')
  @ApiOperation({
    summary: 'Nadaj lub zaktualizuj dostęp do projektu',
    description:
      'Tylko właściciel lub admin może zarządzać dostępem. ' +
      'Jeśli użytkownik już ma dostęp, jego poziom zostanie nadpisany wartością z body.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID projektu' })
  @ApiResponse({ status: 201, description: 'Dostęp nadany / zaktualizowany' })
  @ApiResponse({
    status: 403,
    description: 'Tylko właściciel lub admin może zarządzać dostępem',
  })
  grantAccess(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: GrantAccessDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.grantAccess(id, user.id, user.role, body);
  }

  // ──────────────────────────────────────────────
  // DELETE /projects/:id/members/:userId
  // ──────────────────────────────────────────────
  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Odbierz dostęp do projektu',
    description:
      'Usuwa wpis ProjectMember dla wskazanego użytkownika. Tylko właściciel lub admin.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'ID projektu' })
  @ApiParam({
    name: 'userId',
    example: 7,
    description: 'ID użytkownika, któremu odbieramy dostęp',
  })
  @ApiResponse({ status: 200, description: 'Dostęp odebrany' })
  @ApiResponse({
    status: 403,
    description: 'Tylko właściciel lub admin może odebrać dostęp',
  })
  revokeAccess(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.revokeAccess(
      id,
      targetUserId,
      user.id,
      user.role,
    );
  }

  // ──────────────────────────────────────────────
  // POST /projects/:id/share-links
  // ──────────────────────────────────────────────
  @Post(':id/share-links')
  @ApiOperation({
    summary: 'Utwórz zaproszenie mailowe do projektu',
    description:
      'Tylko właściciel lub admin. Jeśli podano e-mail, link jest od razu wysyłany — ' +
      'a jeśli e-mail należy do zarejestrowanego konta, zaproszenie pojawia się też w powiadomieniach.',
  })
  @ApiParam({ name: 'id', example: 1 })
  createShareLink(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateProjectShareLinkDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.createShareLink(id, user.id, user.role, body);
  }

  // ──────────────────────────────────────────────
  // GET /projects/:id/share-links
  // ──────────────────────────────────────────────
  @Get(':id/share-links')
  @ApiOperation({ summary: 'Lista aktywnych zaproszeń do projektu' })
  @ApiParam({ name: 'id', example: 1 })
  listShareLinks(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.listShareLinks(id, user.id, user.role);
  }

  // ──────────────────────────────────────────────
  // DELETE /projects/:id/share-links/:linkId
  // ──────────────────────────────────────────────
  @Delete(':id/share-links/:linkId')
  @ApiOperation({ summary: 'Odwołaj zaproszenie do projektu' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiParam({ name: 'linkId', example: 3 })
  revokeShareLink(
    @Param('id', ParseIntPipe) id: number,
    @Param('linkId', ParseIntPipe) linkId: number,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.revokeShareLink(id, linkId, user.id, user.role);
  }
}
