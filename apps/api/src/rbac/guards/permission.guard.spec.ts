import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { AuditService } from '../../audit/audit.service';
import { UserRole } from '@prisma/client';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let auditService: Partial<AuditService>;

  beforeEach(() => {
    reflector = new Reflector();
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    guard = new PermissionGuard(reflector, auditService as AuditService);
  });

  function createContext(role: UserRole | null, resource: string | null): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(resource);
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { id: 'u1', role, partnerId: null } : null,
          params: { id: 'test' },
          method: 'GET',
          path: '/api/test',
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('allows when no permission required', async () => {
    const ctx = createContext(UserRole.BDM, null);
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('allows ADMIN on admin resource', async () => {
    const ctx = createContext(UserRole.ADMIN, 'admin');
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('denies IT on admin resource', async () => {
    const ctx = createContext(UserRole.IT, 'admin');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('logs ACCESS_DENIED audit event on denial', async () => {
    const ctx = createContext(UserRole.PARTNER, 'admin');
    try {
      await guard.canActivate(ctx);
    } catch {
      // expected
    }
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ACCESS_DENIED' }),
    );
  });

  it('denies when user is null', async () => {
    const ctx = createContext(null, 'admin');
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
