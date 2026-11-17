import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiError } from '@google/genai';
import { errorBody } from 'src/common/error-body';

export function handleGeminiError(error: unknown): never {
  if (error instanceof ApiError && error.status === 429) {
    throw new HttpException(
      errorBody(
        HttpStatus.TOO_MANY_REQUESTS,
        'AI_QUOTA_EXCEEDED',
        'The daily AI request limit has been reached (Gemini free tier). Try again later.',
      ),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
  throw error;
}
