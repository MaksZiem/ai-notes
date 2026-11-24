import { AiUsageModule } from 'src/ai-usage/ai-usage.module';
import { forwardRef, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { NotesModule } from 'src/notes/notes.module';

@Module({
  imports: [forwardRef(() => NotesModule), AiUsageModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
