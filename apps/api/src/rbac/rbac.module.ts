import { Global, Module } from '@nestjs/common';
import { PartnerFilterService } from './partner-filter.service';
import { BdAssignmentService } from './bd-assignment.service';

@Global()
@Module({
  providers: [PartnerFilterService, BdAssignmentService],
  exports: [PartnerFilterService, BdAssignmentService],
})
export class RbacModule {}
