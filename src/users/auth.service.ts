import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { I18nService } from 'nestjs-i18n';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private i18n: I18nService,
  ) {}

  async signup(email: string, password: string) {
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException(this.i18n.t('common.auth.email_in_use'));
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');

    const user = await this.usersService.create(email, result);

    const payload = { id: user.id, email: user.email, isAdmin: user.isAdmin };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new NotFoundException(this.i18n.t('common.auth.user_not_found'));
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException(this.i18n.t('common.auth.bad_password'));
    }

    const payload = { id: user.id, email: user.email, isAdmin: user.isAdmin };

    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}
