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

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, NoteMember, ProjectMember, UserNotePreference]),
    forwardRef(() => ProjectsModule),
  ],
  controllers: [NotesController, SingleNoteController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}