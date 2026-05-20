import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export type SafeUser = Omit<User, 'passwordHash'>;

const SAFE_SELECT = {
  id: true,
  email: true,
  role: true,
  locale: true,
  status: true,
  partnerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findActiveByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email, status: UserStatus.ACTIVE },
    });
  }

  async listUsers(): Promise<SafeUser[]> {
    return this.prisma.user.findMany({ select: SAFE_SELECT });
  }

  async findByIdSafe(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(params: {
    email: string;
    password: string;
    role: UserRole;
    locale?: string;
    partnerId?: string;
  }): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: params.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(params.password, 12);
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash,
        role: params.role,
        locale: params.locale ?? 'nl',
        partnerId: params.partnerId ?? null,
      },
      select: SAFE_SELECT,
    });
  }

  async updateUser(
    id: string,
    data: { role?: UserRole; locale?: string },
  ): Promise<SafeUser> {
    await this.findByIdSafe(id);
    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    });
  }

  async deactivateUser(id: string): Promise<SafeUser> {
    await this.findByIdSafe(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DEACTIVATED },
      select: SAFE_SELECT,
    });
  }

  async reactivateUser(id: string): Promise<SafeUser> {
    await this.findByIdSafe(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
      select: SAFE_SELECT,
    });
  }
}
