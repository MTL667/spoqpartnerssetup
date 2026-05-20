import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: Partial<Record<string, any>>;

  const mockUser = {
    id: 'user-1',
    email: 'test@spoq.nl',
    passwordHash: 'hashed',
    role: UserRole.BDM,
    locale: 'nl',
    status: UserStatus.ACTIVE,
    partnerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSafeUser = {
    id: 'user-1',
    email: 'test@spoq.nl',
    role: UserRole.BDM,
    locale: 'nl',
    status: UserStatus.ACTIVE,
    partnerId: null,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('listUsers', () => {
    it('returns users without passwordHash', async () => {
      prisma.user.findMany.mockResolvedValue([mockSafeUser]);
      const result = await service.listUsers();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('findByIdSafe', () => {
    it('returns user without passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue(mockSafeUser);
      const result = await service.findByIdSafe('user-1');
      expect(result.id).toBe('user-1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException for unknown id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findByIdSafe('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser', () => {
    it('creates user with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockSafeUser);
      const result = await service.createUser({
        email: 'new@spoq.nl',
        password: 'StrongPwd1!',
        role: UserRole.BDM,
      });
      expect(result).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('throws ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        service.createUser({
          email: 'test@spoq.nl',
          password: 'StrongPwd1!',
          role: UserRole.BDM,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateUser', () => {
    it('sets status to DEACTIVATED', async () => {
      prisma.user.findUnique.mockResolvedValue(mockSafeUser);
      prisma.user.update.mockResolvedValue({
        ...mockSafeUser,
        status: UserStatus.DEACTIVATED,
      });
      const result = await service.deactivateUser('user-1');
      expect(result.status).toBe(UserStatus.DEACTIVATED);
    });
  });

  describe('reactivateUser', () => {
    it('sets status to ACTIVE', async () => {
      const deactivated = { ...mockSafeUser, status: UserStatus.DEACTIVATED };
      prisma.user.findUnique.mockResolvedValue(deactivated);
      prisma.user.update.mockResolvedValue({
        ...deactivated,
        status: UserStatus.ACTIVE,
      });
      const result = await service.reactivateUser('user-1');
      expect(result.status).toBe(UserStatus.ACTIVE);
    });
  });
});
