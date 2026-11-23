import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { errorBody } from '../error-body';
import { HttpExceptionFilter } from './http-exception.filter';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  new HttpExceptionFilter().catch(exception, host);
  return { status: status.mock.calls[0], body: json.mock.calls[0][0] };
}

describe('HttpExceptionFilter', () => {
  it('keeps bodies that already have a code', () => {
    const body = errorBody(
      HttpStatus.NOT_FOUND,
      'WORKOUT_NOT_FOUND',
      'Workout not found',
      { id: 'abc' },
    );
    expect(run(new NotFoundException(body)).body).toEqual(body);
  });

  it('adds a code from the HTTP status to built-in Nest errors', () => {
    const { status, body } = run(new NotFoundException('Cannot GET /nope'));
    expect(status).toEqual([404]);
    expect(body).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Cannot GET /nope',
      params: {},
    });
  });

  it('keeps an array of validation messages', () => {
    const { body } = run(new BadRequestException(['a is wrong', 'b is wrong']));
    expect(body).toEqual({
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: ['a is wrong', 'b is wrong'],
      params: {},
    });
  });

  it('keeps extra fields of bodies without a message, like health check details', () => {
    const details = { database: { status: 'down' } };
    const { body } = run(
      new ServiceUnavailableException({ status: 'error', details }),
    );
    expect(body).toEqual({
      status: 'error',
      details,
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'SERVICE_UNAVAILABLE',
      params: {},
    });
  });

  it('hides unknown errors behind INTERNAL_SERVER_ERROR', () => {
    const { status, body } = run(new Error('db exploded'));
    expect(status).toEqual([500]);
    expect(body).toEqual({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      params: {},
    });
  });
});
