import { SetMetadata } from '@nestjs/common';
import { ResourceGroup } from '../permissions';

export const PERMISSION_KEY = 'requiredPermission';
export const RequirePermission = (resource: ResourceGroup) =>
  SetMetadata(PERMISSION_KEY, resource);
