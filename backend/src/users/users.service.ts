import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { capitalize } from 'src/helpers/capitalize';
import { hashPassword } from 'src/helpers/hash-password';
import { assignDefined } from 'src/helpers/assign-defined';
import { errorBody } from 'src/common/error-body';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(email: string, password: string, name: string, surname: string) {
    const user = this.repo.create({
      email,
      password,
      name: capitalize(name),
      surname: capitalize(surname),
    });
    return this.repo.save(user);
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  find(email: string) {
    return this.repo.find({ where: { email } });
  }

  async update(id: number, attrs: Partial<User>) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(
        errorBody(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', 'User not found'),
      );
    }
    if (attrs.password) {
      attrs.password = await hashPassword(attrs.password);
    }
    assignDefined(user, attrs);
    return this.repo.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(
        errorBody(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', 'User not found'),
      );
    }
    return this.repo.remove(user);
  }
}
