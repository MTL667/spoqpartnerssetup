import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminBdAssignmentsController } from './admin-bd-assignments.controller';
import { AdminImportController } from './admin-import.controller';
import { SessionService } from './session.service';
import { ExcelImportService } from './excel-import.service';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [UsersModule, AuditModule],
  controllers: [AdminUsersController, AdminBdAssignmentsController, AdminImportController],
  providers: [SessionService, ExcelImportService],
})
export class AdminModule {}
