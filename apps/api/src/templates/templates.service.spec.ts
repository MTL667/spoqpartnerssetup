import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationType, ContractType } from '@prisma/client';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      template: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  describe('findActiveTemplate', () => {
    it('returns active template for valid combination', async () => {
      const mockTemplate = { id: 't1', version: 1, active: true };
      prisma.template.findFirst.mockResolvedValue(mockTemplate);

      const result = await service.findActiveTemplate(
        IntegrationType.FORMS_ERP,
        ContractType.EXPERT_PARTNER,
      );
      expect(result.id).toBe('t1');
    });

    it('throws NotFoundException when no active template exists', async () => {
      prisma.template.findFirst.mockResolvedValue(null);

      await expect(
        service.findActiveTemplate(IntegrationType.API_INTEGRATION, ContractType.SOFTWARE_PARTNER),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
