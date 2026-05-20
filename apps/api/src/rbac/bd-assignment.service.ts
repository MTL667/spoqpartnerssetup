import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BdAssignmentService {
  constructor(private prisma: PrismaService) {}

  async assign(bdUserId: string, partnerId: string) {
    try {
      return await this.prisma.bdPartnerAssignment.create({
        data: { bdUserId, partnerId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Assignment already exists');
      }
      throw error;
    }
  }

  async unassign(bdUserId: string, partnerId: string) {
    const assignment = await this.prisma.bdPartnerAssignment.findUnique({
      where: { bdUserId_partnerId: { bdUserId, partnerId } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.bdPartnerAssignment.delete({
      where: { id: assignment.id },
    });
  }

  async getAssignedPartnerIds(bdUserId: string): Promise<string[]> {
    const assignments = await this.prisma.bdPartnerAssignment.findMany({
      where: { bdUserId },
      select: { partnerId: true },
    });
    return assignments.map((a) => a.partnerId);
  }

  async isAssigned(bdUserId: string, partnerId: string): Promise<boolean> {
    const assignment = await this.prisma.bdPartnerAssignment.findUnique({
      where: { bdUserId_partnerId: { bdUserId, partnerId } },
    });
    return !!assignment;
  }

  async getAssignments(bdUserId: string) {
    return this.prisma.bdPartnerAssignment.findMany({
      where: { bdUserId },
    });
  }
}
