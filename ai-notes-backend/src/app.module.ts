import { Module, ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { APP_PIPE } from '@nestjs/core';
import { NotesModule } from './notes/notes.module';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import { ProjectsModule } from './projects/projects.module';
import { UploadsModule } from './uploads/uploads.module';
import * as path from 'path';
import { Project } from './projects/entities/project.entity';
import { ProjectMember } from './projects/entities/project-member.entity';
import { NoteMember } from './notes/entities/note-member.entity';
import { UserProjectPreference } from './projects/entities/project-user-preference.entity';
import { UserNotePreference } from './notes/entities/note-user-preference.entity';
import { Note } from './notes/entities/note.entity';
import { AiModule } from './ai/ai.module';
import { AgentModule } from './agent/agent.module';
import { NoteShareLink } from './notes/entities/note-share-link.entity';
import { ProjectShareLink } from './projects/entities/project-share-link.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    EventEmitterModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'pl',
      loaderOptions: {
        path: path.join(__dirname, 'i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        entities: [
          User,
          Project,
          Note,
          ProjectMember,
          NoteMember,
          NoteShareLink,
          ProjectShareLink,
          UserProjectPreference,
          UserNotePreference,
          Notification
        ],
        synchronize: true,
      }),
    }),
    UsersModule,
    NotesModule,
    ProjectsModule,
    UploadsModule,
    AiModule,
    AgentModule,
    NotificationsModule
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true }),
    },
  ],
})
export class AppModule {}
