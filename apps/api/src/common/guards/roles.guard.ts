import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser, Role } from '@ssm/shared';
import { isRoleAtLeast } from '@ssm/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest() as { user: AuthUser };
    if (!user) return false;

    const hasRole = requiredRoles.some((role) => isRoleAtLeast(user.role, role));
    if (!hasRole) {
      throw new ForbiddenException('Acces interzis — rol insuficient');
    }
    return true;
  }
}
