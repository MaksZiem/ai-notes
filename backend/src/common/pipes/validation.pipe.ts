import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { errorBody } from '../error-body';

function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);
}

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors) =>
      new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'VALIDATION_FAILED',
          collectMessages(errors),
        ),
      ),
  });
}
