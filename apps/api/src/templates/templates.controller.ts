import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UserRole, IntegrationType, ContractType } from '@prisma/client';
import { TemplateManagementService } from './template-management.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateBlueprintsDto } from './dto/update-blueprints.dto';

@Controller('templates')
@UseGuards(RolesGuard)
@Roles(UserRole.BDM, UserRole.ADMIN)
export class TemplatesController {
  constructor(private templateMgmt: TemplateManagementService) {}

  @Post()
  async create(@Body() dto: CreateTemplateDto, @CurrentUser() actor: SafeUser) {
    return this.templateMgmt.createTemplate(
      dto.integrationType,
      dto.contractType,
      dto.blueprints,
      actor.id,
    );
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @CurrentUser() actor: SafeUser) {
    return this.templateMgmt.publishTemplate(id, actor.id);
  }

  @Put(':id/blueprints')
  async updateBlueprints(
    @Param('id') id: string,
    @Body() dto: UpdateBlueprintsDto,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.templateMgmt.updateBlueprints(id, dto.blueprints, actor.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.templateMgmt.getById(id);
  }

  @Get('history/:integrationType/:contractType')
  async getHistory(
    @Param('integrationType') integrationType: IntegrationType,
    @Param('contractType') contractType: ContractType,
  ) {
    return this.templateMgmt.getVersionHistory(integrationType, contractType);
  }
}
