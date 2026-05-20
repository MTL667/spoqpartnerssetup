import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  async create(companyName: string, primaryContactEmail: string) {
    return this.prisma.partner.create({
      data: { companyName, primaryContactEmail },
    });
  }

  async findById(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async list(filter: { partnerId?: string } = {}) {
    const where = filter.partnerId ? { id: filter.partnerId } : {};
    return this.prisma.partner.findMany({
      where,
      include: { onboardings: { select: { id: true, status: true, integrationType: true } } },
    });
  }
}
