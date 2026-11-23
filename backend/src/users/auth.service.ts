import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { hashPassword } from 'src/helpers/hash-password';
import { errorBody } from 'src/common/error-body';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, password: string, name: string, surname: string) {
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'EMAIL_IN_USE',
          'Email is already in use',
        ),
      );
    }

    const result = await hashPassword(password);

    const user = await this.usersService.create(email, result, name, surname);

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      surname: user.surname,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token, user };
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new UnauthorizedException(
        errorBody(
          HttpStatus.UNAUTHORIZED,
          'INVALID_CREDENTIALS',
          'Invalid email or password',
        ),
      );
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (
      storedHashBuffer.length !== hash.length ||
      !timingSafeEqual(storedHashBuffer, hash)
    ) {
      throw new UnauthorizedException(
        errorBody(
          HttpStatus.UNAUTHORIZED,
          'INVALID_CREDENTIALS',
          'Invalid email or password',
        ),
      );
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      surname: user.surname,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return { access_token, user };
  }
}
