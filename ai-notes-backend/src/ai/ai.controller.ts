import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AiService, RewriteMode } from './ai.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { NotesService } from 'src/notes/notes.service';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';

const REWRITE_MODES: RewriteMode[] = [
  'fix',
  'improve',
  'shorten',
  'expand',
  'custom',
];

@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly notesService: NotesService,
  ) {}

  @Post('ping')
  async ping(@Body('prompt') prompt: string) {
    const text = await this.aiService.generateText(prompt);
    return { text };
  }

  @Post('continue')
  async continue(@Body('text') text: string) {
    if (!text?.trim()) {
      throw new BadRequestException('Brak tekstu');
    }
    const continuation = await this.aiService.continueText(text);
    return { continuation };
  }

  @Post('rewrite')
  async rewrite(
    @Body('text') text: string,
    @Body('mode') mode: RewriteMode,
    @Body('instruction') instruction?: string,
  ) {
    if (!text?.trim()) {
      throw new BadRequestException('Brak tekstu');
    }
    if (!REWRITE_MODES.includes(mode)) {
      throw new BadRequestException('Nieprawidłowy tryb');
    }
    if (mode === 'custom' && !instruction?.trim()) {
      throw new BadRequestException('Brak polecenia');
    }

    const result = await this.aiService.rewriteText(text, mode, instruction);
    return { result };
  }

  @Post('title')
  async generateTitle(@Body('content') content: string) {
    if (!content?.trim()) {
      throw new BadRequestException('Brak treści');
    }
    const title = await this.aiService.generateTitle(content);
    return { title };
  }

  @Post('projects/:projectId/summary')
  async generateProjectSummary(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: User,
  ) {
    const notes = await this.notesService.findAllNotesInProject(
      projectId,
      user.id,
      user.role,
    );
    if (!notes.length) {
      throw new BadRequestException('Projekt nie ma jeszcze żadnych notatek');
    }
    const summary = await this.aiService.summarizeProject(notes);
    return { summary };
  }

  @Post('keywords')
  async suggestKeywords(@Body('content') content: string) {
    if (!content?.trim()) {
      throw new BadRequestException('Brak treści');
    }
    const keywords = await this.aiService.suggestKeywords(content);
    return { keywords };
  }
}
