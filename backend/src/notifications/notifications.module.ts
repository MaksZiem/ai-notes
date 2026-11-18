import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsListener } from './notifications.listener';
import { NotificationsGateway } from './notifications.gateway';
import { NotesModule } from 'src/notes/notes.module';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), NotesModule, ProjectsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsListener, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}