import { UserRole } from '@prisma/client';

export type ResourceGroup = 'admin' | 'onboarding' | 'tasks' | 'partners' | 'templates' | 'portal';
export type AccessLevel = 'none' | 'read' | 'own' | 'own-visible' | 'own-actions' | 'own-company' | 'full';

const ROLE_PERMISSIONS: Record<UserRole, Record<ResourceGroup, AccessLevel>> = {
  ADMIN: {
    admin: 'full',
    onboarding: 'read',
    tasks: 'read',
    partners: 'full',
    templates: 'read',
    portal: 'none',
  },
  BDM: {
    admin: 'none',
    onboarding: 'full',
    tasks: 'full',
    partners: 'full',
    templates: 'full',
    portal: 'none',
  },
  BD: {
    admin: 'none',
    onboarding: 'read',
    tasks: 'own',
    partners: 'own-company',
    templates: 'none',
    portal: 'none',
  },
  IT: {
    admin: 'none',
    onboarding: 'none',
    tasks: 'own',
    partners: 'read',
    templates: 'none',
    portal: 'none',
  },
  MARKETING: {
    admin: 'none',
    onboarding: 'none',
    tasks: 'own-visible',
    partners: 'read',
    templates: 'none',
    portal: 'none',
  },
  SALES: {
    admin: 'none',
    onboarding: 'none',
    tasks: 'own',
    partners: 'read',
    templates: 'none',
    portal: 'none',
  },
  PARTNER: {
    admin: 'none',
    onboarding: 'none',
    tasks: 'own-actions',
    partners: 'own-company',
    templates: 'none',
    portal: 'full',
  },
};

export function getPermission(role: UserRole, resource: ResourceGroup): AccessLevel {
  return ROLE_PERMISSIONS[role]?.[resource] ?? 'none';
}

export function hasAccess(role: UserRole, resource: ResourceGroup): boolean {
  return getPermission(role, resource) !== 'none';
}

export function hasFullAccess(role: UserRole, resource: ResourceGroup): boolean {
  return getPermission(role, resource) === 'full';
}
