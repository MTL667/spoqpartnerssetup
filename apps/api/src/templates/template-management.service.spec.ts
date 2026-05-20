import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TemplateManagementService } from './template-management.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IntegrationType, ContractType, UserRole } from '@prisma/client';

describe('TemplateManagementService', () => {
  let service: TemplateManagementService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      template: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 't1', version: 1, blueprints: [] }),
        update: jest.fn().mockResolvedValue({ id: 't1', active: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      templateTaskBlueprint: {
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateManagementService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TemplateManagementService>(TemplateManagementService);
  });

  describe('createTemplate', () => {
    it('creates template with auto-incremented version', async () => {
      prisma.template.findFirst.mockResolvedValue({ version: 2 });

      await service.createTemplate(
        IntegrationType.FORMS_ERP,
        ContractType.EXPERT_PARTNER,
        [{ title: 'Task 1', phaseSequence: 1, ownerRole: UserRole.BDM }],
        'actor-1',
      );

      expect(prisma.template.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 3, active: false }),
        }),
      );
    });

    it('starts at version 1 when no existing templates', async () => {
      prisma.template.findFirst.mockResolvedValue(null);

      await service.createTemplate(
        IntegrationType.API_INTEGRATION,
        ContractType.SOFTWARE_PARTNER,
        [{ title: 'Task 1', phaseSequence: 1, ownerRole: UserRole.IT }],
        'actor-1',
      );

      expect(prisma.template.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 1 }),
        }),
      );
    });

    it('logs TEMPLATE_CREATED audit event', async () => {
      prisma.template.findFirst.mockResolvedValue(null);

      await service.createTemplate(
        IntegrationType.FORMS_ERP,
        ContractType.EXPERT_PARTNER,
        [{ title: 'Task', phaseSequence: 1, ownerRole: UserRole.BDM }],
        'actor-1',
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TEMPLATE_CREATED' }),
      );
    });
  });

  describe('publishTemplate', () => {
    it('publishes template and deactivates previous versions', async () => {
      prisma.template.findUnique.mockResolvedValue({
        id: 't1', active: false, version: 2,
        integrationType: IntegrationType.FORMS_ERP,
        contractType: ContractType.EXPERT_PARTNER,
        blueprints: [{ title: 'Task', phaseSequence: 1, dependsOnKeys: [] }],
      });

      await service.publishTemplate('t1', 'actor-1');

      expect(prisma.template.updateMany).toHaveBeenCalled();
      expect(prisma.template.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { active: true },
      });
    });

    it('throws when template is already active', async () => {
      prisma.template.findUnique.mockResolvedValue({
        id: 't1', active: true, blueprints: [{}],
      });

      await expect(service.publishTemplate('t1', 'a')).rejects.toThrow(BadRequestException);
    });

    it('throws when template has no blueprints', async () => {
      prisma.template.findUnique.mockResolvedValue({
        id: 't1', active: false, blueprints: [],
      });

      await expect(service.publishTemplate('t1', 'a')).rejects.toThrow(BadRequestException);
    });

    it('blocks publish with invalid dependency graph', async () => {
      prisma.template.findUnique.mockResolvedValue({
        id: 't1', active: false,
        blueprints: [
          { title: 'A', phaseSequence: 1, dependsOnKeys: ['NonExistent'] },
        ],
      });

      await expect(service.publishTemplate('t1', 'a')).rejects.toThrow(BadRequestException);
    });

    it('blocks publish with self-referencing dependency', async () => {
      prisma.template.findUnique.mockResolvedValue({
        id: 't1', active: false,
        blueprints: [
          { title: 'A', phaseSequence: 1, dependsOnKeys: ['A'] },
        ],
      });

      await expect(service.publishTemplate('t1', 'a')).rejects.toThrow(BadRequestException);
    });

    it('throws when template not found', async () => {
      prisma.template.findUnique.mockResolvedValue(null);
      await expect(service.publishTemplate('invalid', 'a')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBlueprints', () => {
    it('replaces blueprints on draft template', async () => {
      prisma.template.findUnique.mockResolvedValue({ id: 't1', active: false });

      await service.updateBlueprints(
        't1',
        [{ title: 'Updated', phaseSequence: 1, ownerRole: UserRole.BDM }],
        'actor-1',
      );

      expect(prisma.templateTaskBlueprint.deleteMany).toHaveBeenCalledWith({ where: { templateId: 't1' } });
      expect(prisma.template.update).toHaveBeenCalled();
    });

    it('throws when editing active template', async () => {
      prisma.template.findUnique.mockResolvedValue({ id: 't1', active: true });

      await expect(
        service.updateBlueprints('t1', [], 'a'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
