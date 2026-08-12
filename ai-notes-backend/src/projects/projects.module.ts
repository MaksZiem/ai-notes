import { forwardRef, Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { NotesModule } from 'src/notes/notes.module';
import { UserProjectPreference } from './entities/project-user-preference.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, UserProjectPreference]),
    forwardRef(() => NotesModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

