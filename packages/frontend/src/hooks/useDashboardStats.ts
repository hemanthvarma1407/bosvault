'use client';

import { useState, useEffect, useRef } from 'react';
import { dashboardService } from '@/lib/api/services';
import { IdRequestModel } from '@bosvault/shared-models';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
    assets: {
        total: number;
        byStatus: { status: string; count: string }[];
    };
    tickets: {
        total: number;
        byStatus: { status: string; count: string }[];
        byPriority: { priority: string; count: string }[];
        recent: any[];
        openCritical: number;
    };
    employees: {
        total: number;
        byDepartment: { department: string; count: string }[];
    };
    licenses: {
        total: number;
        expiringSoon: any[];
    };
    systemHealth: {
        assetUtilization: number;
        ticketResolutionRate: number;
        openCriticalTickets: number;
    };
    security: {
        score: number;
        metrics: {
            identity: number;
            devices: number;
            compliance: number;
        };
    };
}

export function useDashboardStats() {
    const { user, isAuthenticated } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasFetched = useRef(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.companyId || hasFetched.current) return;

            try {
                setIsLoading(true);
                const req = new IdRequestModel(user.companyId);
                const response = await dashboardService.getDashboardStats(req);

                if (response && response.status && response.data) {
                    setStats(response.data as any);
                    hasFetched.current = true;
                }
            } catch (err) {
                console.error('Failed to fetch stats for layout:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated && user?.companyId) {
            fetchStats();
        }

        // Periodic refresh every 5 minutes
        const interval = setInterval(() => {
            hasFetched.current = false;
            fetchStats();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isAuthenticated, user?.companyId]);

    return { stats, isLoading };
}
