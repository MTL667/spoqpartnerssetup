import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { RbacModule } from './rbac/rbac.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { TasksModule } from './tasks/tasks.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';
import { PartnerPortalModule } from './partner-portal/partner-portal.module';
import { I18nModule } from './i18n/i18n.module';
import { AuthenticatedGuard } from './auth/guards/authenticated.guard';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    AuditModule,
    AdminModule,
    RbacModule,
    OnboardingModule,
    TasksModule,
    DashboardModule,
    NotificationsModule,
    CommentsModule,
    PartnerPortalModule,
    I18nModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticatedGuard,
    },
  ],
})
export class AppModule {}
