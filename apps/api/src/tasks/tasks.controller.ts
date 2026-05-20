import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskGeneratorService } from './task-generator.service';
import { TaskStatusEngineService } from './task-status-engine.service';
import { DeliverableService } from './deliverable.service';
import { ChecklistService } from './checklist.service';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UploadDeliverableDto } from './dto/upload-deliverable.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private taskGenerator: TaskGeneratorService,
    private taskStatusEngine: TaskStatusEngineService,
    private deliverableService: DeliverableService,
    private checklistService: ChecklistService,
  ) {}

  @Get('onboarding/:onboardingId')
  async listByOnboarding(@Param('onboardingId') onboardingId: string) {
    return this.tasksService.findByOnboarding(onboardingId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Get(':id/deliverables')
  async getDeliverables(@Param('id') id: string) {
    return this.deliverableService.getRequirements(id);
  }

  @Get(':id/checklist')
  async getChecklist(@Param('id') id: string) {
    return this.checklistService.getChecklist(id);
  }

  @Post('generate/:onboardingId')
  async generate(@Param('onboardingId') onboardingId: string) {
    return this.taskGenerator.generateTasksForOnboarding(onboardingId);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.taskStatusEngine.transitionTask(id, dto.status);
  }

  @Post(':id/upload')
  async upload(
    @Param('id') id: string,
    @Body() dto: UploadDeliverableDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.deliverableService.uploadDeliverable(
      dto.requirementId,
      dto.fileName,
      dto.storageRef,
      user.id,
    );
  }

  @Patch('checklist/:itemId/toggle')
  async toggleChecklistItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.checklistService.toggleItem(itemId, user.id);
  }

  @Post(':id/complete')
  async completeTask(@Param('id') id: string) {
    return this.checklistService.completeTask(id);
  }
}
