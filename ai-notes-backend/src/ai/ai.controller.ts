import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from 'src/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {

  }

  @Post('ping')
  async ping(@Body('prompt') prompt: string) {
    const text = await this.aiService.generateText(prompt)
    return {text}
  }
}