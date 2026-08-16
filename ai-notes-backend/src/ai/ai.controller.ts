import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AiService, RewriteMode } from './ai.service';
import { AuthGuard } from 'src/guards/auth.guard';

const REWRITE_MODES: RewriteMode[] = ['fix', 'improve', 'shorten', 'expand'];

@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
  async rewrite(@Body('text') text: string, @Body('mode') mode: RewriteMode) {
    if (!text?.trim()) {
      throw new BadRequestException('Brak tekstu');
    }
    if (!REWRITE_MODES.includes(mode)) {
      throw new BadRequestException('Nieprawidłowy tryb');
    }

    const result = await this.aiService.rewriteText(text, mode)
    return {result}
  }
}
