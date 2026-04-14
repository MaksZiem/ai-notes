import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
// dsa÷
@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>,
  private i18n: I18nService,
) {}

  create(email: string, password: string) {
    const user = this.repo.create({ email, password });
    return this.repo.save(user);
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  find(email: string) {
    return this.repo.find({ where: { email } });
  }

  async update(id: number, attrs: Partial<User>) {
    const user = await this.findOne(id)
    if (!user) {
      throw new NotFoundException(this.i18n.t('common.users.not_found'));
    }
    Object.assign(user, attrs)
    return this.repo.save(user)
  }

  async remove(id: number) {
    const user = await this.findOne(id)
    if (!user) {
      throw new NotFoundException(this.i18n.t('common.users.not_found'));
    }
    return this.repo.remove(user)
  }
}
