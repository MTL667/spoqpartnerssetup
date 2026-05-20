import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      this.logger.warn('ADMIN_EMAIL not set — skipping bootstrap');
      return;
    }

    const userCount = await this.prisma.user.count();
    if (userCount > 0) return;

    const tempPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await this.prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.PENDING_SETUP,
        locale: 'nl',
      },
    });

    this.logger.log(`Admin account created for ${adminEmail} — setup required via /setup`);
  }
}
