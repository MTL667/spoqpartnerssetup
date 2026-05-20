import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { SessionService } from './session.service';
import { SafeUser } from '../auth/auth.service';

@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(
    private usersService: UsersService,
    private auditService: AuditService,
    private sessionService: SessionService,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: SafeUser) {
    const user = await this.usersService.createUser(dto);
    await this.auditService.log({
      actorId: actor.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });
    return user;
  }

  @Get()
  async list() {
    return this.usersService.listUsers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findByIdSafe(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: SafeUser,
  ) {
    const user = await this.usersService.updateUser(id, dto);
    await this.auditService.log({
      actorId: actor.id,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user.id,
      metadata: { changes: dto },
    });
    return user;
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string, @CurrentUser() actor: SafeUser) {
    if (id === actor.id) {
      throw new BadRequestException('Cannot deactivate your own account');
    }
    const user = await this.usersService.deactivateUser(id);
    await this.sessionService.destroyUserSessions(id);
    await this.auditService.log({
      actorId: actor.id,
      action: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: user.id,
    });
    return user;
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivate(@Param('id') id: string, @CurrentUser() actor: SafeUser) {
    const user = await this.usersService.reactivateUser(id);
    await this.auditService.log({
      actorId: actor.id,
      action: 'USER_REACTIVATED',
      entityType: 'User',
      entityId: user.id,
    });
    return user;
  }
}
