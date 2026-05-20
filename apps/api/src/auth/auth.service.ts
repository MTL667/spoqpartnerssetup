import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<SafeUser> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.DEACTIVATED) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.PENDING_SETUP) {
      throw new UnauthorizedException('Account setup required');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return toSafeUser(user);
  }

  async getUserProfile(userId: string): Promise<SafeUser | null> {
    const user = await this.usersService.findById(userId);
    if (!user) return null;
    return toSafeUser(user);
  }

  async getSetupStatus(): Promise<{ needsSetup: boolean; email: string | null }> {
    const pendingAdmin = await this.prisma.user.findFirst({
      where: { status: UserStatus.PENDING_SETUP },
    });
    return {
      needsSetup: !!pendingAdmin,
      email: pendingAdmin?.email ?? null,
    };
  }

  async completeSetup(email: string, password: string): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { email, status: UserStatus.PENDING_SETUP },
    });

    if (!user) {
      throw new BadRequestException('Geen setup account gevonden voor dit e-mailadres');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, status: UserStatus.ACTIVE },
    });

    return toSafeUser(updated);
  }
}
