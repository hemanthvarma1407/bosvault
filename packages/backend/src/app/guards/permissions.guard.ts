import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/permissions.decorator';
import { AuthUsersEntity } from '../features/auth-users/entities/auth-users.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private dataSource: DataSource
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermission) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // payload from JwtStrategy uses userId
        const targetUserId = user?.userId || user?.id;
        if (!targetUserId) {
            return false;
        }

        // 1. Fetch User and check for Legacy Admin Role bypass
        const userRepo = this.dataSource.getRepository(AuthUsersEntity);
        const userEntity = await userRepo.findOne({ where: { id: targetUserId } });

        if (!userEntity) {
            return false;
        }

        // Bypass for ADMIN or SUPER_ADMIN
        const userRoles: string[] = userEntity.roles || (userEntity.userRole ? [userEntity.userRole] : []);
        const hasAdminBypass = userRoles.some(role => {
            const upperRole = role?.toUpperCase() || '';
            return upperRole.includes('ADMIN') || upperRole === 'SUPER_ADMIN';
        });
        if (hasAdminBypass) {
            return true;
        }

        // 2. Fetch Dynamic Roles for this user
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
            // Get role IDs
            const userRoles = await queryRunner.manager.query(
                'SELECT role_id FROM user_roles WHERE user_id = ?',
                [targetUserId]
            );
            const roleIds = userRoles.map((ur: any) => ur.role_id);
            
            if (roleIds.length === 0) return false;

            // Check if any assigned role is an ADMIN role (Bypass)
            const roles = await queryRunner.manager.query(
                `SELECT name, code FROM roles WHERE id IN (${roleIds.join(',')})`
            );
            
            const hasAdminRole = roles.some((r: any) => 
                (r.code?.toUpperCase() || '').includes('ADMIN') || 
                (r.name?.toUpperCase() || '').includes('ADMIN')
            );

            if (hasAdminRole) return true;

            // 3. Check for specific permission
            const permissions = await queryRunner.manager.query(
                `SELECT p.resource, p.action 
                 FROM permissions p
                 JOIN role_permissions rp ON p.id = rp.permission_id
                 WHERE rp.role_id IN (${roleIds.join(',')})`
            );

            const hasPermission = permissions.some((p: any) => 
                p.resource === requiredPermission.resource && 
                p.action === requiredPermission.action
            );

            if (!hasPermission) {
                throw new ForbiddenException(`You do not have permission to ${requiredPermission.action} ${requiredPermission.resource}`);
            }

            return true;
        } finally {
            await queryRunner.release();
        }
    }
}
