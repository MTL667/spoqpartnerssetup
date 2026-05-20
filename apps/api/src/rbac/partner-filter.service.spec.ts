import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PartnerFilterService } from './partner-filter.service';
import { BdAssignmentService } from './bd-assignment.service';

describe('PartnerFilterService', () => {
  let service: PartnerFilterService;
  let bdAssignment: Partial<BdAssignmentService>;

  beforeEach(() => {
    bdAssignment = {
      getAssignedPartnerIds: jest.fn().mockResolvedValue(['p1', 'p2']),
      isAssigned: jest.fn().mockResolvedValue(true),
    };
    service = new PartnerFilterService(bdAssignment as BdAssignmentService);
  });

  describe('getFilter', () => {
    it('returns partnerId filter for PARTNER users', async () => {
      const user = { id: 'u1', role: UserRole.PARTNER, partnerId: 'p1' };
      expect(await service.getFilter(user)).toEqual({ partnerId: 'p1' });
    });

    it('returns empty filter for internal users', async () => {
      const user = { id: 'u1', role: UserRole.BDM, partnerId: null };
      expect(await service.getFilter(user)).toEqual({});
    });

    it('returns empty filter for ADMIN', async () => {
      const user = { id: 'u1', role: UserRole.ADMIN, partnerId: null };
      expect(await service.getFilter(user)).toEqual({});
    });

    it('returns assigned partnerIds filter for BD users', async () => {
      const user = { id: 'bd1', role: UserRole.BD, partnerId: null };
      expect(await service.getFilter(user)).toEqual({ partnerId: { in: ['p1', 'p2'] } });
    });
  });

  describe('assertPartnerAccess', () => {
    it('does not throw for internal users', async () => {
      const user = { id: 'u1', role: UserRole.BDM, partnerId: null };
      await expect(service.assertPartnerAccess(user, 'any-partner')).resolves.toBeUndefined();
    });

    it('does not throw when partner accesses own data', async () => {
      const user = { id: 'u1', role: UserRole.PARTNER, partnerId: 'p1' };
      await expect(service.assertPartnerAccess(user, 'p1')).resolves.toBeUndefined();
    });

    it('throws when partner accesses another partners data', async () => {
      const user = { id: 'u1', role: UserRole.PARTNER, partnerId: 'p1' };
      await expect(service.assertPartnerAccess(user, 'p2')).rejects.toThrow(ForbiddenException);
    });

    it('does not throw when BD accesses assigned partner', async () => {
      (bdAssignment.isAssigned as jest.Mock).mockResolvedValue(true);
      const user = { id: 'bd1', role: UserRole.BD, partnerId: null };
      await expect(service.assertPartnerAccess(user, 'p1')).resolves.toBeUndefined();
    });

    it('throws when BD accesses unassigned partner', async () => {
      (bdAssignment.isAssigned as jest.Mock).mockResolvedValue(false);
      const user = { id: 'bd1', role: UserRole.BD, partnerId: null };
      await expect(service.assertPartnerAccess(user, 'p3')).rejects.toThrow(ForbiddenException);
    });
  });
});
