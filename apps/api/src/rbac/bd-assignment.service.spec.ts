import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BdAssignmentService } from './bd-assignment.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BdAssignmentService', () => {
  let service: BdAssignmentService;
  let prisma: Partial<Record<string, any>>;

  const mockAssignment = {
    id: 'assign-1',
    bdUserId: 'bd-user-1',
    partnerId: 'partner-1',
    assignedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      bdPartnerAssignment: {
        create: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BdAssignmentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BdAssignmentService>(BdAssignmentService);
  });

  describe('assign', () => {
    it('creates a new assignment', async () => {
      prisma.bdPartnerAssignment.create.mockResolvedValue(mockAssignment);
      const result = await service.assign('bd-user-1', 'partner-1');
      expect(result.bdUserId).toBe('bd-user-1');
      expect(result.partnerId).toBe('partner-1');
    });

    it('throws ConflictException for duplicate assignment', async () => {
      prisma.bdPartnerAssignment.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.assign('bd-user-1', 'partner-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('unassign', () => {
    it('removes an assignment', async () => {
      prisma.bdPartnerAssignment.findUnique.mockResolvedValue(mockAssignment);
      prisma.bdPartnerAssignment.delete.mockResolvedValue(mockAssignment);
      await service.unassign('bd-user-1', 'partner-1');
      expect(prisma.bdPartnerAssignment.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException for non-existent assignment', async () => {
      prisma.bdPartnerAssignment.findUnique.mockResolvedValue(null);
      await expect(service.unassign('bd-user-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAssignedPartnerIds', () => {
    it('returns list of assigned partner IDs', async () => {
      prisma.bdPartnerAssignment.findMany.mockResolvedValue([
        { partnerId: 'p1' },
        { partnerId: 'p2' },
      ]);
      const result = await service.getAssignedPartnerIds('bd-user-1');
      expect(result).toEqual(['p1', 'p2']);
    });

    it('returns empty array when no assignments', async () => {
      prisma.bdPartnerAssignment.findMany.mockResolvedValue([]);
      const result = await service.getAssignedPartnerIds('bd-user-1');
      expect(result).toEqual([]);
    });
  });

  describe('isAssigned', () => {
    it('returns true when assigned', async () => {
      prisma.bdPartnerAssignment.findUnique.mockResolvedValue(mockAssignment);
      expect(await service.isAssigned('bd-user-1', 'partner-1')).toBe(true);
    });

    it('returns false when not assigned', async () => {
      prisma.bdPartnerAssignment.findUnique.mockResolvedValue(null);
      expect(await service.isAssigned('bd-user-1', 'partner-2')).toBe(false);
    });
  });
});
