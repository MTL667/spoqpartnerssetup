import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { ResourceGroup, hasAccess } from '../permissions';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<ResourceGroup>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!resource) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException();

    if (!hasAccess(user.role, resource)) {
      await this.auditService.log({
        actorId: user.id,
        action: 'ACCESS_DENIED',
        entityType: resource,
        entityId: request.params?.id ?? 'unknown',
        metadata: {
          role: user.role,
          resource,
          method: request.method,
          path: request.path,
        },
      });
      throw new ForbiddenException();
    }

    return true;
  }
}
