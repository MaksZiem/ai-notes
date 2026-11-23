import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';
import { errorBody } from 'src/common/error-body';
import { readSessionToken } from 'src/users/session-cookie';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = readSessionToken(request.headers.cookie);

    if (!token) {
      throw new UnauthorizedException(
        errorBody(
          HttpStatus.UNAUTHORIZED,
          'MISSING_TOKEN',
          'Missing authorization token',
        ),
      );
    }

    let payload: { id: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException(
        errorBody(
          HttpStatus.UNAUTHORIZED,
          'INVALID_TOKEN',
          'Token is invalid or expired',
        ),
      );
    }

    const user = await this.usersService.findOne(payload.id);
    if (!user) {
      throw new UnauthorizedException(
        errorBody(
          HttpStatus.UNAUTHORIZED,
          'INVALID_TOKEN',
          'Token is invalid or expired',
        ),
      );
    }
    request['currentUser'] = user;
    return true;
  }
}
