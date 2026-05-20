import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(role: UserRole | null, requiredRoles: UserRole[] | null): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { id: 'u1', role, email: 'a@b.c' } : null,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('allows when no roles required', () => {
    const ctx = createMockContext(UserRole.BDM, null);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows admin when ADMIN required', () => {
    const ctx = createMockContext(UserRole.ADMIN, [UserRole.ADMIN]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies non-admin when ADMIN required', () => {
    const ctx = createMockContext(UserRole.BDM, [UserRole.ADMIN]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies when user is null', () => {
    const ctx = createMockContext(null, [UserRole.ADMIN]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
