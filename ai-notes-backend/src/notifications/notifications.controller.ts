import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista powiadomień użytkownika (max 50, najnowsze pierwsze)',
  })
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAllForUser(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Liczba nieprzeczytanych powiadomień' })
  async unreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.unreadCount(user.id);
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Oznacz wszystkie powiadomienia jako przeczytane' })
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Oznacz powiadomienie jako przeczytane' })
  markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post(':id/accept')
  @ApiOperation({
    summary: 'Zaakceptuj zaproszenie do notatki (typ NOTE_INVITE)',
    description: 'Dołącza do notatki przez powiązany link udostępniania i oznacza zaproszenie jako zaakceptowane.',
  })
  accept(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.notificationsService.accept(id, user.id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Odrzuć zaproszenie do notatki (typ NOTE_INVITE)' })
  decline(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.notificationsService.decline(id, user.id);
  }
}
