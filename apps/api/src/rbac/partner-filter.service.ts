import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BdAssignmentService } from './bd-assignment.service';

interface UserContext {
  id: string;
  role: UserRole;
  partnerId: string | null;
}

export interface PartnerFilter {
  partnerId?: string | { in: string[] };
}

@Injectable()
export class PartnerFilterService {
  constructor(private bdAssignmentService: BdAssignmentService) {}

  async getFilter(user: UserContext): Promise<PartnerFilter> {
    if (user.role === UserRole.PARTNER && user.partnerId) {
      return { partnerId: user.partnerId };
    }

    if (user.role === UserRole.BD) {
      const partnerIds = await this.bdAssignmentService.getAssignedPartnerIds(user.id);
      return { partnerId: { in: partnerIds } };
    }

    return {};
  }

  isPartnerUser(user: UserContext): boolean {
    return user.role === UserRole.PARTNER;
  }

  isBdUser(user: UserContext): boolean {
    return user.role === UserRole.BD;
  }

  async assertPartnerAccess(user: UserContext, resourcePartnerId: string): Promise<void> {
    if (user.role === UserRole.PARTNER) {
      if (user.partnerId !== resourcePartnerId) {
        throw new ForbiddenException('Partner access violation');
      }
      return;
    }

    if (user.role === UserRole.BD) {
      const isAssigned = await this.bdAssignmentService.isAssigned(user.id, resourcePartnerId);
      if (!isAssigned) {
        throw new ForbiddenException('BD access violation — partner not assigned');
      }
      return;
    }
  }
}
