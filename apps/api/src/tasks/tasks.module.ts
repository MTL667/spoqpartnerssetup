import { Module } from '@nestjs/common';
import { TaskGeneratorService } from './task-generator.service';
import { TasksService } from './tasks.service';
import { TaskStatusEngineService } from './task-status-engine.service';
import { DeliverableService } from './deliverable.service';
import { ChecklistService } from './checklist.service';
import { TasksController } from './tasks.controller';

@Module({
  providers: [
    TaskGeneratorService,
    TasksService,
    TaskStatusEngineService,
    DeliverableService,
    ChecklistService,
  ],
  controllers: [TasksController],
  exports: [
    TaskGeneratorService,
    TasksService,
    TaskStatusEngineService,
    DeliverableService,
    ChecklistService,
  ],
})
export class TasksModule {}
