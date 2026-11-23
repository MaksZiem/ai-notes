import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../user.entity';

export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { currentUser?: User }>();

    return request.currentUser;
  },
);
