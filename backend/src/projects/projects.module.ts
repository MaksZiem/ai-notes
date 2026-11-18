import { forwardRef, Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { NotesModule } from 'src/notes/notes.module';
import { UserProjectPreference } from './entities/project-user-preference.entity';
import { ProjectShareLink } from './entities/project-share-link.entity';
import { PublicProjectShareController } from './public-project-share.controller';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectMember,
      UserProjectPreference,
      ProjectShareLink,
    ]),
    forwardRef(() => NotesModule),
    MailModule,
  ],
  controllers: [ProjectsController, PublicProjectShareController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

