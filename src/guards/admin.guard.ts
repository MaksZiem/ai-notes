import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(this.i18n.t('common.auth.missing_token'));
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['currentUser'] = payload;
    } catch {
      throw new UnauthorizedException(this.i18n.t('common.auth.invalid_token'));
    }

    if (!request['currentUser']?.isAdmin) {
      throw new ForbiddenException(this.i18n.t('common.auth.forbidden'));
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
