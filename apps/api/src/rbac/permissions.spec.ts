import { UserRole } from '@prisma/client';
import { getPermission, hasAccess, hasFullAccess } from './permissions';

describe('Permissions', () => {
  describe('getPermission', () => {
    it('ADMIN has full admin access', () => {
      expect(getPermission(UserRole.ADMIN, 'admin')).toBe('full');
    });

    it('BDM has no admin access', () => {
      expect(getPermission(UserRole.BDM, 'admin')).toBe('none');
    });

    it('BDM has full onboarding access', () => {
      expect(getPermission(UserRole.BDM, 'onboarding')).toBe('full');
    });

    it('IT has own task access', () => {
      expect(getPermission(UserRole.IT, 'tasks')).toBe('own');
    });

    it('MARKETING has own-visible task access', () => {
      expect(getPermission(UserRole.MARKETING, 'tasks')).toBe('own-visible');
    });

    it('PARTNER has own-company partner access', () => {
      expect(getPermission(UserRole.PARTNER, 'partners')).toBe('own-company');
    });

    it('PARTNER has full portal access', () => {
      expect(getPermission(UserRole.PARTNER, 'portal')).toBe('full');
    });

    it('PARTNER has no admin access', () => {
      expect(getPermission(UserRole.PARTNER, 'admin')).toBe('none');
    });
  });

  describe('hasAccess', () => {
    it('returns true for ADMIN on admin resource', () => {
      expect(hasAccess(UserRole.ADMIN, 'admin')).toBe(true);
    });

    it('returns false for IT on admin resource', () => {
      expect(hasAccess(UserRole.IT, 'admin')).toBe(false);
    });

    it('returns false for PARTNER on templates', () => {
      expect(hasAccess(UserRole.PARTNER, 'templates')).toBe(false);
    });

    it('returns true for PARTNER on portal', () => {
      expect(hasAccess(UserRole.PARTNER, 'portal')).toBe(true);
    });
  });

  describe('hasFullAccess', () => {
    it('returns true for BDM on templates', () => {
      expect(hasFullAccess(UserRole.BDM, 'templates')).toBe(true);
    });

    it('returns false for IT on tasks (own, not full)', () => {
      expect(hasFullAccess(UserRole.IT, 'tasks')).toBe(false);
    });
  });

  describe('BD role permissions', () => {
    it('BD has no admin access', () => {
      expect(getPermission(UserRole.BD, 'admin')).toBe('none');
    });

    it('BD has read onboarding access', () => {
      expect(getPermission(UserRole.BD, 'onboarding')).toBe('read');
    });

    it('BD has own task access', () => {
      expect(getPermission(UserRole.BD, 'tasks')).toBe('own');
    });

    it('BD has own-company partner access', () => {
      expect(getPermission(UserRole.BD, 'partners')).toBe('own-company');
    });

    it('BD has no template access', () => {
      expect(hasAccess(UserRole.BD, 'templates')).toBe(false);
    });

    it('existing roles are unaffected by BD addition', () => {
      expect(getPermission(UserRole.ADMIN, 'admin')).toBe('full');
      expect(getPermission(UserRole.BDM, 'onboarding')).toBe('full');
      expect(getPermission(UserRole.IT, 'tasks')).toBe('own');
      expect(getPermission(UserRole.MARKETING, 'tasks')).toBe('own-visible');
      expect(getPermission(UserRole.SALES, 'tasks')).toBe('own');
      expect(getPermission(UserRole.PARTNER, 'portal')).toBe('full');
    });
  });
});
