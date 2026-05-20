import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedGuard } from './authenticated.guard';

describe('AuthenticatedGuard', () => {
  let guard: AuthenticatedGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AuthenticatedGuard(reflector);
  });

  function createMockContext(isAuthenticated: boolean, isPublic = false): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
    return {
      switchToHttp: () => ({
        getRequest: () => ({ isAuthenticated: () => isAuthenticated }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('allows access to public routes regardless of auth', () => {
    const ctx = createMockContext(false, true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user is authenticated', () => {
    const ctx = createMockContext(true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws UnauthorizedException when user is not authenticated', () => {
    const ctx = createMockContext(false);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
