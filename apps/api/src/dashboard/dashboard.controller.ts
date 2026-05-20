import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartnerFilterService } from '../rbac/partner-filter.service';
import { SafeUser } from '../auth/auth.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private partnerFilterService: PartnerFilterService,
  ) {}

  @Get('alerts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN, UserRole.BD)
  async getAlerts(@CurrentUser() user: SafeUser) {
    const filter = await this.partnerFilterService.getFilter(user);
    return this.dashboardService.getAlerts(filter);
  }

  @Get('drill-down/:onboardingId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN, UserRole.BD)
  async getDrillDown(@Param('onboardingId') onboardingId: string) {
    return this.dashboardService.getDrillDown(onboardingId);
  }
}
