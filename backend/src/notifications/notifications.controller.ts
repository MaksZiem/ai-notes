import { ParseIdPipe } from 'src/common/pipes/parse-id.pipe';
import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
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
  ForbiddenErrorDto,
  NotFoundErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { SESSION_AUTH } from 'src/common/swagger/swagger.setup';
import { Notification } from './entities/notification.entity';
import {
  SuccessResponseDto,
  UnreadCountDto,
} from './dtos/notification-response.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiCookieAuth(SESSION_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak lub nieważne cookie sesji',
  type: UnauthorizedErrorDto,
})
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista powiadomień użytkownika (max 50, najnowsze pierwsze)',
  })
  @ApiOkResponse({
    description: 'Powiadomienia z autorem, notatką i projektem',
    type: Notification,
    isArray: true,
  })
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAllForUser(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Liczba nieprzeczytanych powiadomień' })
  @ApiOkResponse({
    description: 'Liczba nieprzeczytanych',
    type: UnreadCountDto,
  })
  async unreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.unreadCount(user.id);
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Oznacz wszystkie powiadomienia jako przeczytane' })
  @ApiOkResponse({
    description: 'Wszystkie oznaczone jako przeczytane',
    type: SuccessResponseDto,
  })
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Oznacz powiadomienie jako przeczytane' })
  @ApiOkResponse({ description: 'Powiadomienie', type: Notification })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID powiadomienia',
  })
  @ApiNotFoundResponse({
    description: 'Powiadomienie nie istnieje (kod NOTIFICATION_NOT_FOUND)',
    type: NotFoundErrorDto,
  })
  markAsRead(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post(':id/accept')
  @ApiOperation({
    summary: 'Zaakceptuj zaproszenie do notatki (typ NOTE_INVITE)',
    description:
      'Dołącza do notatki przez powiązany link udostępniania i oznacza zaproszenie jako zaakceptowane.',
  })
  @ApiCreatedResponse({
    description: 'Zaakceptowane zaproszenie',
    type: Notification,
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID powiadomienia',
  })
  @ApiForbiddenResponse({
    description:
      'Zaproszenie zostało już obsłużone (kod INVITATION_ALREADY_HANDLED)',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Powiadomienie lub zaproszenie nie istnieje',
    type: NotFoundErrorDto,
  })
  accept(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: User) {
    return this.notificationsService.accept(id, user.id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Odrzuć zaproszenie do notatki (typ NOTE_INVITE)' })
  @ApiCreatedResponse({
    description: 'Odrzucone zaproszenie',
    type: Notification,
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID powiadomienia',
  })
  @ApiForbiddenResponse({
    description:
      'Zaproszenie zostało już obsłużone (kod INVITATION_ALREADY_HANDLED)',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Powiadomienie nie istnieje (kod NOTIFICATION_NOT_FOUND)',
    type: NotFoundErrorDto,
  })
  decline(@Param('id', ParseIdPipe) id: string, @CurrentUser() user: User) {
    return this.notificationsService.decline(id, user.id);
  }
}
