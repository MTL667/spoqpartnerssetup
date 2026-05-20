import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BdAssignmentService } from '../rbac/bd-assignment.service';
import { AuditService } from '../audit/audit.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';

@Controller('admin/bd-assignments')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBdAssignmentsController {
  constructor(
    private bdAssignmentService: BdAssignmentService,
    private auditService: AuditService,
  ) {}

  @Post()
  async assign(
    @Body() body: { bdUserId: string; partnerId: string },
    @CurrentUser() actor: SafeUser,
  ) {
    const assignment = await this.bdAssignmentService.assign(body.bdUserId, body.partnerId);
    await this.auditService.log({
      actorId: actor.id,
      action: 'BD_PARTNER_ASSIGNED',
      entityType: 'BdPartnerAssignment',
      entityId: assignment.id,
      metadata: { bdUserId: body.bdUserId, partnerId: body.partnerId },
    });
    return assignment;
  }

  @Delete(':bdUserId/:partnerId')
  @HttpCode(HttpStatus.OK)
  async unassign(
    @Param('bdUserId') bdUserId: string,
    @Param('partnerId') partnerId: string,
    @CurrentUser() actor: SafeUser,
  ) {
    await this.bdAssignmentService.unassign(bdUserId, partnerId);
    await this.auditService.log({
      actorId: actor.id,
      action: 'BD_PARTNER_UNASSIGNED',
      entityType: 'BdPartnerAssignment',
      entityId: `${bdUserId}:${partnerId}`,
      metadata: { bdUserId, partnerId },
    });
    return { message: 'Unassigned' };
  }

  @Get(':bdUserId')
  async listAssignments(@Param('bdUserId') bdUserId: string) {
    return this.bdAssignmentService.getAssignments(bdUserId);
  }
}
