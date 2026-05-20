import { Module, forwardRef } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { DeadlinePlannerService } from './deadline-planner.service';
import { LifecycleService } from './lifecycle.service';
import { PartnersModule } from '../partners/partners.module';
import { TemplatesModule } from '../templates/templates.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PartnersModule, TemplatesModule, forwardRef(() => TasksModule)],
  controllers: [OnboardingController],
  providers: [OnboardingService, DeadlinePlannerService, LifecycleService],
  exports: [OnboardingService, DeadlinePlannerService, LifecycleService],
})
export class OnboardingModule {}
