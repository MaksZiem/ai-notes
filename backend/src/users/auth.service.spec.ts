import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { hashPassword } from 'src/helpers/hash-password';
import { UserRole } from 'src/enums/user-role.enum';

describe('AuthService', () => {
  let usersService: { find: jest.Mock; create: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    usersService = { find: jest.fn(), create: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-token') };
    service = new AuthService(usersService as any, jwtService as any);
  });

  describe('signup', () => {
    it('rejects an email that is already in use', async () => {
      usersService.find.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.signup('ola@example.com', 'secret123', 'Ola', 'Nowak'),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('stores a hashed password, never the plain one', async () => {
      usersService.find.mockResolvedValue([]);
      usersService.create.mockResolvedValue({ id: 1 });

      await service.signup('ola@example.com', 'secret123', 'Ola', 'Nowak');

      const storedPassword: string = usersService.create.mock.calls[0][1];
      expect(storedPassword).not.toContain('secret123');
      expect(storedPassword).toMatch(/^[0-9a-f]+\.[0-9a-f]+$/);
    });

    it('returns a token with the user data in the payload', async () => {
      usersService.find.mockResolvedValue([]);
      usersService.create.mockResolvedValue({
        id: 1,
        email: 'ola@example.com',
        role: UserRole.USER,
        name: 'Ola',
        surname: 'Nowak',
      });

      const result = await service.signup(
        'ola@example.com',
        'secret123',
        'Ola',
        'Nowak',
      );

      expect(result).toEqual({ access_token: 'jwt-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: 1,
        email: 'ola@example.com',
        role: UserRole.USER,
        name: 'Ola',
        surname: 'Nowak',
      });
    });
  });

  describe('signin', () => {
    it('rejects an unknown email', async () => {
      usersService.find.mockResolvedValue([]);

      await expect(
        service.signin('nobody@example.com', 'secret123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      usersService.find.mockResolvedValue([
        { id: 1, password: await hashPassword('secret123') },
      ]);

      await expect(
        service.signin('ola@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('returns a token for the correct password', async () => {
      usersService.find.mockResolvedValue([
        {
          id: 1,
          email: 'ola@example.com',
          role: UserRole.USER,
          password: await hashPassword('secret123'),
        },
      ]);

      const result = await service.signin('ola@example.com', 'secret123');

      expect(result).toEqual({ access_token: 'jwt-token' });
    });
  });
});
