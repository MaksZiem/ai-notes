import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiError } from '@google/genai';

/**
 * Gemini's free-tier daily quota is easy to exhaust (20 requests/day on
 * some models) — surface that as a clear, retryable 429 instead of letting
 * the raw ApiError bubble up as an opaque 500.
 */
export function handleGeminiError(error: unknown): never {
  if (error instanceof ApiError && error.status === 429) {
    throw new HttpException(
      'Wyczerpano dzienny limit zapytań do AI (darmowy plan Gemini). Spróbuj ponownie później.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
  throw error;
}
