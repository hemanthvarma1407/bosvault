import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleEnum } from '@bosvault/shared-models';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check if user exists and has a role
        if (!user) {
            return false;
        }

        const userRoles: string[] = user.roles || (user.role ? [user.role] : []);
        if (userRoles.length === 0) {
            return false;
        }

        // Check if user's role is in the required roles
        return requiredRoles.some((role) => userRoles.includes(role));
    }
}
