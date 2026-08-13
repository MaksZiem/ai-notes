import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { I18nService } from 'nestjs-i18n';
import { hashPassword } from 'src/helpers/hash-password';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private i18n: I18nService,
  ) {}

  async signup(email: string, password: string, name: string, surname: string) {
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException(this.i18n.t('common.auth.email_in_use'));
    }

    const result = await hashPassword(password);

    const user = await this.usersService.create(email, result, name, surname);

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name, surname: user.surname };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new UnauthorizedException(this.i18n.t('common.auth.invalid_credentials'));
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (
      storedHashBuffer.length !== hash.length ||
      !timingSafeEqual(storedHashBuffer, hash)
    ) {
      throw new UnauthorizedException(this.i18n.t('common.auth.invalid_credentials'));
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name, surname: user.surname };

    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}
