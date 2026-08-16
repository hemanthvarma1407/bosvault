'use client';

import { useAuth } from '@/contexts/AuthContext';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useEffect, useState } from 'react';
import { UserRoleEnum } from '@bosvault/shared-models';

interface RouteGuardProps {
    children: React.ReactNode;
    requiredRoles?: UserRoleEnum[];
    fallbackPath?: string;
}

export function RouteGuard({
    children,
    requiredRoles,
    fallbackPath = '/tickets'
}: RouteGuardProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            // Check if user is authenticated
            if (!isAuthenticated) {
                const currentPath = window.location.pathname + window.location.search;
                window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
                return;
            }

            // If no specific roles required, allow access
            if (!requiredRoles || requiredRoles.length === 0) {
                setIsAuthorized(true);
                return;
            }

            // Check if user has required role
            const userRoles: string[] = user.roles || (user?.role ? [user.role] : []);
            const normalizedUserRoles = userRoles.map(r => r.toUpperCase());
            const normalizedRequiredRoles = requiredRoles.map(r => r.toUpperCase());

            // Flexible check: If ADMIN or SUPER_ADMIN is required, any role containing "ADMIN" is allowed (except ASSET_ADMIN)
            const isAdminPath = normalizedRequiredRoles.some(r => (r.includes('ADMIN') && r !== 'ASSET_ADMIN') || r === 'SUPER_ADMIN');
            
            const hasPermission = normalizedRequiredRoles.some(reqRole => {
                if (isAdminPath) {
                    return normalizedUserRoles.some(uRole => uRole.includes('ADMIN') || uRole === reqRole);
                }
                return normalizedUserRoles.includes(reqRole);
            });

            if (!hasPermission) {
                window.location.href = fallbackPath;
                return;
            }

            setIsAuthorized(true);
        }
    }, [isLoading, isAuthenticated, user, requiredRoles, fallbackPath]);

    // Show loading state
    if (isLoading) {
        return <LoadingScreen />;
    }

    // Don't render children until authorized
    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}
