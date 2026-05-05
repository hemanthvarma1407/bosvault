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
                window.location.href = '/login';
                return;
            }

            // If no specific roles required, allow access
            if (!requiredRoles || requiredRoles.length === 0) {
                setIsAuthorized(true);
                return;
            }

            // Check if user has required role
            const userRole = user?.role?.toUpperCase() || '';
            const normalizedRequiredRoles = requiredRoles.map(r => r.toUpperCase());

            // Flexible check: If ADMIN is required, any role containing "ADMIN" is allowed
            const isAdminPath = normalizedRequiredRoles.includes('ADMIN') || normalizedRequiredRoles.includes('SUPER_ADMIN');
            const hasPermission = isAdminPath
                ? (userRole.includes('ADMIN') || normalizedRequiredRoles.includes(userRole))
                : normalizedRequiredRoles.includes(userRole);

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
