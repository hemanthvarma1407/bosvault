import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import { AssetStatusEnum, TicketStatusEnum, DashboardStatsResponseModel, DashboardStats, IdRequestModel } from '@bosvault/shared-models';
import { AssetInfoEntity } from '../asset-info/entities/asset-info.entity';
import { TicketsEntity } from '../tickets/entities/tickets.entity';
import { AuthUsersEntity } from '../auth-users/entities/auth-users.entity';
import { DataSource, In } from 'typeorm';

@Injectable()
export class DashboardService {
    constructor(
        private readonly repository: DashboardRepository,
        private readonly dataSource: DataSource
    ) { }

    /**
     * Get consolidated statistics for the dashboard
     * Aggregates data from assets, tickets, employees, and licenses
     * Filtered by company ID
     */
    async getDashboardStats(reqModel: IdRequestModel): Promise<DashboardStatsResponseModel> {
        try {
            const companyId = reqModel.id;
            const where: any = companyId > 0 ? { companyId } : {};

            const [assetStats, ticketStats, employeeStats, licenseStats, procurementStats] = await Promise.all([
                this.repository.getAssetStats(companyId),
                this.repository.getTicketStats(companyId),
                this.repository.getEmployeeStats(companyId),
                this.repository.getLicenseStats(companyId),
                this.repository.getProcurementStats(companyId)
            ]);

            // Security Metrics Calculations (Direct DB access in Service as requested)
            const userRepo = this.dataSource.getRepository(AuthUsersEntity);
            const assetRepo = this.dataSource.getRepository(AssetInfoEntity);
            const ticketRepo = this.dataSource.getRepository(TicketsEntity);

            const [totalUsers, activeUsers, totalAssets, assignedAssets, totalTickets, resolvedTickets] = await Promise.all([
                userRepo.count({ where }),
                userRepo.count({ where: { ...where, status: true } }),
                assetRepo.count({ where }),
                assetRepo.count({ where: { ...where, assetStatusEnum: In([AssetStatusEnum.IN_USE]) } }),
                ticketRepo.count({ where }),
                ticketRepo.count({ where: { ...where, ticketStatus: In([TicketStatusEnum.CLOSED, TicketStatusEnum.RESOLVED]) } })
            ]);

            // Asset Utilization
            const inUseCount = assetStats.byStatus.find((s: any) => s.status === AssetStatusEnum.IN_USE)?.count || 0;
            const assetUtilization = assetStats.total > 0 ? (Number(inUseCount) / assetStats.total) * 100 : 0;

            // Ticket Resolution Rate
            const closedResolvedCount = ticketStats.byStatus
                .filter((s: any) => s.status === TicketStatusEnum.CLOSED || s.status === TicketStatusEnum.RESOLVED)
                .reduce((sum: number, item: any) => sum + Number(item.count), 0);
            const ticketResolutionRate = ticketStats.total > 0 ? (closedResolvedCount / ticketStats.total) * 100 : 0;

            const identityScore = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 100;
            const deviceScore = totalAssets > 0 ? (assignedAssets / totalAssets) * 100 : 100;
            const complianceScore = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 100;

            const securityMetrics = {
                identity: Math.round(identityScore),
                devices: Math.round(deviceScore),
                compliance: Math.round(complianceScore)
            };

            const securityScore = Math.round((securityMetrics.identity + securityMetrics.devices + securityMetrics.compliance) / 3);

            const stats: DashboardStats = {
                assets: { total: assetStats.total, byStatus: assetStats.byStatus },
                tickets: {
                    total: ticketStats.total,
                    byStatus: ticketStats.byStatus,
                    byPriority: ticketStats.byPriority,
                    recent: ticketStats.recent
                },
                employees: { total: employeeStats.total, byDepartment: employeeStats.byDept },
                licenses: {
                    total: licenseStats.total,
                    expiringSoon: licenseStats.expiring.map(l => ({
                        id: l.id,
                        applicationName: l.applicationName,
                        expiryDate: l.expiryDate,
                        assignedTo: l.assignedTo
                    }))
                },
                procurement: procurementStats
            };
            return new DashboardStatsResponseModel(true, 200, 'Dashboard stats retrieved successfully', stats);
        } catch (error) {
            throw error;
        }
    }
}
