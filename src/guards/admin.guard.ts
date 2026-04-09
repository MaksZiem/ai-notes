import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Brak tokenu autoryzacyjnego');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['currentUser'] = payload;
    } catch {
      throw new UnauthorizedException('Token nieważny lub wygasły');
    }

    if (!request['currentUser']?.isAdmin) {
      throw new ForbiddenException('Brak uprawnień administratora');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
