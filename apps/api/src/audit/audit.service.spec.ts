import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: Partial<Record<string, any>>;

  beforeEach(async () => {
    prisma = {
      auditEvent: {
        create: jest.fn().mockResolvedValue({
          id: 'audit-1',
          actorId: 'actor-1',
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: 'user-1',
          metadata: null,
          createdAt: new Date(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('creates audit event with all fields', async () => {
    await service.log({
      actorId: 'actor-1',
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: 'user-1',
      metadata: { email: 'test@spoq.nl' },
    });

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorId: 'actor-1',
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: 'user-1',
        metadata: { email: 'test@spoq.nl' },
      },
    });
  });

  it('creates audit event without metadata', async () => {
    await service.log({
      actorId: 'actor-1',
      action: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: 'user-1',
    });

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'USER_DEACTIVATED',
        metadata: undefined,
      }),
    });
  });
});
