import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { errorBody, ErrorParams } from '../error-body';

type ExceptionBody = {
  code?: unknown;
  message?: unknown;
  params?: unknown;
};

function statusCode(status: number) {
  const name: unknown = HttpStatus[status];
  return typeof name === 'string' ? name : 'ERROR';
}

function toMessage(value: unknown, fallback: string): string | string[] {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value;
  }
  return fallback;
}

function normalize(status: number, body: string | object) {
  const fallback = statusCode(status);
  if (typeof body === 'string') {
    return errorBody(status, fallback, body);
  }
  const { code, message, params } = body as ExceptionBody;
  const normalized = errorBody(
    status,
    typeof code === 'string' ? code : fallback,
    toMessage(message, fallback),
    typeof params === 'object' && params !== null
      ? (params as ErrorParams)
      : {},
  );
  return message === undefined ? { ...body, ...normalized } : normalized;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(normalize(status, exception.getResponse()));
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        errorBody(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'INTERNAL_SERVER_ERROR',
          'Internal server error',
        ),
      );
  }
}
