import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export type RewriteMode = 'fix' | 'improve' | 'shorten' | 'expand';

@Injectable()
export class AiService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY'),
    });
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });
    return response.text ?? '';
  }

  async summarizeText(content: string): Promise<string> {
    const prompt = [
      'Streść poniższą notatkę w maksymalnie 3 krótkich zdaniach, po polsku.',
      'Zwróć wyłącznie streszczenie, bez wstępów typu "Oto streszczenie:".',
      '',
      'Notatka:',
      content,
    ].join('\n');
    return this.generateText(prompt);
  }

  async continueText(textBeforeCursor: string): Promise<string> {
    const prompt = [
      'Kontynuuj poniższy tekst naturalnie, w tym samym języku i stylu co autor.',
      'Napisz tylko dalszy ciąg (1-3 zdania). Nie powtarzaj istniejącego tekstu, nie dodawaj komentarzy ani cudzysłowów.',
      '',
      'Tekst:',
      textBeforeCursor,
    ].join('\n');
    return this.generateText(prompt);
  }

  async rewriteText(text: string, mode: RewriteMode): Promise<string> {
    const instructions: Record<RewriteMode, string> = {
      fix: 'Popraw błędy gramatyczne, interpunkcyjne i stylistyczne w poniższym tekście, zachowując oryginalny sens i język.',
      improve:
        'Przeformułuj poniższy tekst, poprawiając styl i płynność, zachowując oryginalny sens i język.',
      shorten:
        'Skróć poniższy tekst, zachowując najważniejsze informacje i oryginalny język.',
      expand:
        'Rozwiń poniższy tekst, dodając więcej szczegółów, zachowując oryginalny sens i język.',
    };
    const prompt = [
      instructions[mode],
      'Zwróć wyłącznie zmieniony tekst, bez komentarzy, wyjaśnień ani cudzysłowów.',
      '',
      'Tekst:',
      text,
    ].join('\n');
    return this.generateText(prompt);
  }
}
