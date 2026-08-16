import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly client: GoogleGenAI
  private readonly model: string

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({apiKey: this.config.get<string>('GEMINI_API_KEY')})
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt
    })
    return response.text ?? ''
  }
}