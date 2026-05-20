import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationType, ContractType } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findActiveTemplate(integrationType: IntegrationType, contractType: ContractType) {
    const template = await this.prisma.template.findFirst({
      where: { integrationType, contractType, active: true },
      orderBy: { version: 'desc' },
    });
    if (!template) {
      throw new NotFoundException(
        `No active template for ${integrationType}/${contractType}`,
      );
    }
    return template;
  }

  async findById(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }
}
