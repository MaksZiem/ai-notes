import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { APP_PIPE } from '@nestjs/core';
import { NotesModule } from './notes/notes.module';
import { ProjectsModule } from './projects/projects.module';
import { UploadsModule } from './uploads/uploads.module';
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
import { YjsModule } from './yjs/yjs.module';
import { HealthModule } from './health/health.module';
import { createValidationPipe } from './common/pipes/validation.pipe';
import { createDataSourceOptions } from './database/database.options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...createDataSourceOptions((key) => config.get<string>(key)),
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
          Notification,
        ],
      }),
    }),
    UsersModule,
    NotesModule,
    ProjectsModule,
    UploadsModule,
    AiModule,
    AgentModule,
    NotificationsModule,
    YjsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: createValidationPipe(),
    },
  ],
})
export class AppModule {}
