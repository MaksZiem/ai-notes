import { AiUsageModule } from 'src/ai-usage/ai-usage.module';
import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { NotesModule } from 'src/notes/notes.module';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  imports: [NotesModule, ProjectsModule, AiUsageModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
