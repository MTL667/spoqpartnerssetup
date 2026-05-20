import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OnboardingService } from './onboarding.service';
import { DeadlinePlannerService } from './deadline-planner.service';
import { LifecycleService } from './lifecycle.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartnerFilterService } from '../rbac/partner-filter.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { SetGoLiveDateDto } from './dto/set-go-live-date.dto';
import { OverrideDueDateDto } from './dto/override-due-date.dto';
import { SafeUser } from '../auth/auth.service';

@Controller('onboardings')
export class OnboardingController {
  constructor(
    private onboardingService: OnboardingService,
    private deadlinePlanner: DeadlinePlannerService,
    private lifecycleService: LifecycleService,
    private partnerFilterService: PartnerFilterService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async create(@Body() dto: CreateOnboardingDto, @CurrentUser() actor: SafeUser) {
    return this.onboardingService.createOnboarding({
      ...dto,
      actorId: actor.id,
    });
  }

  @Get()
  async list(@CurrentUser() user: SafeUser) {
    const filter = await this.partnerFilterService.getFilter(user);
    return this.onboardingService.list(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.onboardingService.findById(id);
  }

  @Post(':id/go-live-date')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async setGoLiveDate(
    @Param('id') id: string,
    @Body() dto: SetGoLiveDateDto,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.deadlinePlanner.setGoLiveDate(id, new Date(dto.targetGoLiveDate), actor.id);
  }

  @Post(':id/recalculate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async recalculate(@Param('id') id: string, @CurrentUser() actor: SafeUser) {
    return this.deadlinePlanner.recalculate(id, actor.id);
  }

  @Patch('tasks/:taskId/due-date')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async overrideDueDate(
    @Param('taskId') taskId: string,
    @Body() dto: OverrideDueDateDto,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.deadlinePlanner.overrideTaskDueDate(taskId, new Date(dto.dueDate), actor.id);
  }

  @Post(':id/advance-phase')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async advancePhase(@Param('id') id: string, @CurrentUser() actor: SafeUser) {
    return this.lifecycleService.advancePhase(id, actor.id);
  }

  @Post(':id/archive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async archive(@Param('id') id: string, @CurrentUser() actor: SafeUser) {
    return this.lifecycleService.archiveOnboarding(id, actor.id);
  }

  @Get('archived/list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async listArchived(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.lifecycleService.listArchived({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
