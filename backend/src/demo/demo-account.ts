import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { errorBody } from 'src/common/error-body';

export const DEMO_EMAIL = 'demo-login@example.com';
export const DEMO_PASSWORD = 'password-demo';

export function isDemoAccount(user: { email: string }): boolean {
  return user.email.toLowerCase() === DEMO_EMAIL;
}

export function demoAccountLocked(message: string) {
  return new ForbiddenException(
    errorBody(HttpStatus.FORBIDDEN, 'DEMO_ACCOUNT_LOCKED', message),
  );
}
