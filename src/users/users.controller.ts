import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService
  ) {}
}
