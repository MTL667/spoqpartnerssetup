import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplateManagementService } from './template-management.service';
import { TemplateIsolationService } from './template-isolation.service';
import { TemplatesController } from './templates.controller';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplateManagementService, TemplateIsolationService],
  exports: [TemplatesService, TemplateManagementService, TemplateIsolationService],
})
export class TemplatesModule {}
