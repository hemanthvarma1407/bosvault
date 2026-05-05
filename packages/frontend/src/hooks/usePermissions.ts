import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRoleEnum } from '@bosvault/shared-models';

export function usePermissions() {
    const { user } = useAuth();

    const hasRole = (roles: UserRoleEnum[]): boolean => {
        if (!user?.role) return false;
        return roles.includes(user.role as UserRoleEnum);
    };

    const isAdmin = (): boolean => {
        return hasRole([UserRoleEnum.ADMIN]);
    };

    const isManager = (): boolean => {
        return hasRole([UserRoleEnum.MANAGER]);
    };

    const isUser = (): boolean => {
        return hasRole([UserRoleEnum.USER]);
    };

    const canAccessDashboard = (): boolean => {
        return hasRole([UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]);
    };

    const canAccessEmployees = (): boolean => {
        return hasRole([UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]);
    };

    const canAccessAssets = (): boolean => {
        return hasRole([UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]);
    };

    const canAccessMasters = (): boolean => {
        return hasRole([UserRoleEnum.ADMIN]);
    };

    const canAccessTickets = (): boolean => {
        return true; // All authenticated users can access tickets
    };

    const canAccessSupport = (): boolean => {
        return true; // All authenticated users can access support chat
    };

    const canManageUsers = (): boolean => {
        return hasRole([UserRoleEnum.ADMIN]);
    };

    const canManageCompany = (): boolean => {
        return hasRole([UserRoleEnum.ADMIN]);
    };

    return useMemo(() => ({
        hasRole,
        isAdmin,
        isManager,
        isUser,
        canAccessDashboard,
        canAccessEmployees,
        canAccessAssets,
        canAccessMasters,
        canAccessTickets,
        canAccessSupport,
        canManageUsers,
        canManageCompany,
    }), [user]);
}
