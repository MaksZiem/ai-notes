import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from 'src/users/user.entity';
import { AiUsageService } from './ai-usage.service';

@Injectable()
export class AiLimitGuard implements CanActivate {
  constructor(private readonly aiUsage: AiUsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { currentUser?: User }>();
    if (request.currentUser) {
      await this.aiUsage.consume(request.currentUser.id);
    }
    return true;
  }
}
