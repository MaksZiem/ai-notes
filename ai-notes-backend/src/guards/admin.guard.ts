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
import { UserRole } from 'src/enums/user-role.enum';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private i18n: I18nService,
    private usersService: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(this.i18n.t('common.auth.missing_token'));
    }

    let payload: { id: number };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException(this.i18n.t('common.auth.invalid_token'));
    }

    const user = await this.usersService.findOne(payload.id);
    if (!user) {
      throw new UnauthorizedException(this.i18n.t('common.auth.invalid_token'));
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(this.i18n.t('common.auth.forbidden'));
    }

    request['currentUser'] = user;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}