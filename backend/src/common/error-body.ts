import { HttpStatus } from '@nestjs/common';

export type ErrorParams = Record<string, string | number>;

export function errorBody(
  status: HttpStatus,
  code: string,
  message: string | string[],
  params: ErrorParams = {},
) {
  return { statusCode: status, code, message, params };
}
