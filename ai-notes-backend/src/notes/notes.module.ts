import { forwardRef, Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from 'src/projects/projects.module';
import { NoteMember } from './entities/note-member.entity';
import { ProjectMember } from 'src/projects/entities/project-member.entity';
import { UserNotePreference } from './entities/note-user-preference.entity';
import { Note } from './entities/note.entity';
import { SingleNoteController } from './single-note.controller';
import { AiModule } from 'src/ai/ai.module';
import { NoteShareLink } from './entities/note-share-link.entity';
import { PublicShareController } from './public-share.controller';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Note,
      NoteMember,
      NoteShareLink,
      ProjectMember,
      UserNotePreference,
    ]),
    forwardRef(() => ProjectsModule),
    AiModule,
    MailModule
  ],
  controllers: [NotesController, SingleNoteController, PublicShareController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
