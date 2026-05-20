import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@spoq.nl',
    passwordHash: '',
    role: UserRole.BDM,
    locale: 'nl',
    status: UserStatus.ACTIVE,
    partnerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('CorrectPassword1!', 12);
  });

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('returns safe user on valid credentials', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      const result = await authService.validateUser('test@spoq.nl', 'CorrectPassword1!');
      expect(result).toBeDefined();
      expect(result.email).toBe('test@spoq.nl');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws UnauthorizedException when user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(
        authService.validateUser('nonexistent@spoq.nl', 'any'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        authService.validateUser('test@spoq.nl', 'WrongPassword!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for deactivated user', async () => {
      const deactivatedUser = { ...mockUser, status: UserStatus.DEACTIVATED };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(deactivatedUser);
      await expect(
        authService.validateUser('test@spoq.nl', 'CorrectPassword1!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('never leaks whether email exists (same error for email not found vs wrong password)', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      try {
        await authService.validateUser('notfound@spoq.nl', 'any');
      } catch (e: any) {
        expect(e.message).toBe('Invalid credentials');
      }

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      try {
        await authService.validateUser('test@spoq.nl', 'WrongPassword!');
      } catch (e: any) {
        expect(e.message).toBe('Invalid credentials');
      }
    });
  });

  describe('getUserProfile', () => {
    it('returns safe user profile without passwordHash', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      const result = await authService.getUserProfile('user-1');
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result!.id).toBe('user-1');
    });

    it('returns null for non-existent user', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);
      const result = await authService.getUserProfile('nonexistent');
      expect(result).toBeNull();
    });
  });
});
