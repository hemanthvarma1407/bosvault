
import { Injectable } from '@nestjs/common';
import { LicenseRepository } from './repositories/license.repository';
import { In } from 'typeorm';
import { GlobalResponse } from '@bosvault/backend-utils';
import { CreateLicenseModel, UpdateLicenseModel, DeleteLicenseModel, GetAllLicensesResponseModel, GetLicenseStatisticsResponseModel, LicenseStatsModel, LicenseResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { CompanyLicenseEntity } from './entities/company-license.entity';
import { CompanyInfoEntity } from '../masters/company-info/entities/company-info.entity';
import { LicensesMasterEntity } from '../masters/license/entities/license.entity';
import { EmployeesEntity } from '../employees/entities/employees.entity';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@bosvault/shared-models';
import { LicenseService as LicenseMasterService } from '../masters/license/license.service';

@Injectable()
export class LicensesService {
    constructor(
        private repo: LicenseRepository,
        private notificationsService: NotificationsService,
        private licenseMasterService: LicenseMasterService
    ) { }

    /**
     * Retrieve all license assignments, optionally filtered by company
     * Fetches licenses with related company, application, and employee information manually
     * 
     * @param reqModel - Request containing optional company ID to filter licenses
     * @returns GetAllLicensesResponseModel with array of license data including relations
     */
    async getAllLicenses(reqModel: IdRequestModel): Promise<GetAllLicensesResponseModel> {
        const companyId = reqModel.id;
        const query = this.repo.createQueryBuilder('license')
            .orderBy('license.createdAt', 'DESC');

        if (companyId) {
            query.where('license.companyId = :companyId', { companyId });
        }

        const licenses = await query.getMany();

        if (licenses.length === 0) {
            return new GetAllLicensesResponseModel(true, 200, 'Licenses retrieved successfully', []);
        }

        // Collect IDs for manual fetching
        const uniqueCompanyIds = [...new Set(licenses.map(l => l.companyId).filter(id => !!id))];
        const uniqueAppIds = [...new Set(licenses.map(l => l.applicationId).filter(id => !!id))];
        const uniqueEmpIds = [...new Set(licenses.map(l => l.assignedEmployeeId).filter(id => !!id))];

        // Fetch related entities using EntityManager
        const manager = this.repo.manager;

        const [companies, applications, employees] = await Promise.all([
            uniqueCompanyIds.length > 0 ? manager.getRepository(CompanyInfoEntity).find({ where: { id: In(uniqueCompanyIds) } }) : [],
            uniqueAppIds.length > 0 ? manager.getRepository(LicensesMasterEntity).find({ where: { id: In(uniqueAppIds) } }) : [],
            uniqueEmpIds.length > 0 ? manager.getRepository(EmployeesEntity).find({ where: { id: In(uniqueEmpIds) } }) : []
        ]);

        // Create Lookup Maps
        const companyMap = new Map<number, CompanyInfoEntity>(companies.map(c => [Number(c.id), c] as [number, CompanyInfoEntity]));
        const appMap = new Map<number, LicensesMasterEntity>(applications.map(a => [Number(a.id), a] as [number, LicensesMasterEntity]));
        const empMap = new Map<number, EmployeesEntity>(employees.map(e => [Number(e.id), e] as [number, EmployeesEntity]));

        const licenseResponses = licenses.map(l => {
            const company = companyMap.get(Number(l.companyId));
            const app = appMap.get(Number(l.applicationId));
            const emp = l.assignedEmployeeId ? empMap.get(Number(l.assignedEmployeeId)) : undefined;

            return new LicenseResponseModel(
                l.id,
                l.companyId,
                l.applicationId,
                l.createdAt,
                l.updatedAt,
                l.assignedEmployeeId,
                l.licenseKey,
                l.purchaseDate,
                l.assignedDate,
                l.expiryDate,
                undefined, // seats
                l.totalSeats,
                Number(l.costPerSeat),
                l.billingCycle,
                l.remarks,
                l.role,
                company ? { id: company.id, companyName: company.companyName } : undefined,
                app ? { id: app.id, name: app.name, logo: '' } : undefined,
                emp ? { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, avatar: emp.slackAvatar } : undefined
            );
        });

        return new GetAllLicensesResponseModel(true, 200, 'Licenses retrieved successfully', licenseResponses);
    }

    /**
     * Calculate license statistics for dashboard
     * Computes total licenses, used licenses, and licenses expiring within 30 days
     * 
     * @param reqModel - Request containing optional company ID to filter statistics
     * @returns GetLicenseStatisticsResponseModel with license statistics
     */
    async getLicenseStatistics(reqModel: IdRequestModel): Promise<GetLicenseStatisticsResponseModel> {
        const companyId = reqModel.id;
        const query = this.repo.createQueryBuilder('license');

        if (companyId) {
            query.where('license.companyId = :companyId', { companyId });
        }

        const licenses = await query.getMany();

        let total = 0;
        let used = 0;
        let totalCost = 0;

        licenses.forEach(l => {
            total += (l.totalSeats || 1);
            // In this simplified model, each license record is an assignment
            // If totalSeats > 1, it might represent a pool. 
            // For now, let's assume each record is a specific assignment of one or more seats.
            used += 1;
            totalCost += Number(l.costPerSeat || 0) * (l.totalSeats || 1);
        });

        // Expiring in 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringSoon = licenses.filter(l =>
            l.expiryDate && new Date(l.expiryDate) <= thirtyDaysFromNow && new Date(l.expiryDate) >= new Date()
        ).length;

        const stats = new LicenseStatsModel(total, used, totalCost, expiringSoon);
        return new GetLicenseStatisticsResponseModel(true, 200, 'License statistics retrieved successfully', stats);
    }

    async getUtilization(reqModel: IdRequestModel): Promise<any> {
        const stats = await this.getLicenseStatistics(reqModel);
        if (!stats.status) return stats;

        return {
            status: true,
            data: {
                totalPurchased: stats.statistics.totalLicenses,
                totalAssigned: stats.statistics.usedLicenses,
                utilizationRate: stats.statistics.totalLicenses > 0 ? (stats.statistics.usedLicenses / stats.statistics.totalLicenses) * 100 : 0
            }
        };
    }

    async getComplianceReport(reqModel: IdRequestModel): Promise<any> {
        const companyId = reqModel.id;
        const licenses = await this.repo.find({ where: companyId ? { companyId } : {} });

        // Group by application
        const report = licenses.reduce((acc, l) => {
            const appId = l.applicationId;
            if (!acc[appId]) {
                acc[appId] = { appId, purchased: 0, assigned: 0 };
            }
            acc[appId].purchased += (l.totalSeats || 1);
            acc[appId].assigned += 1;
            return acc;
        }, {} as any);

        return {
            status: true,
            data: Object.values(report).map((item: any) => ({
                ...item,
                status: item.assigned > item.purchased ? 'OVER_LICENSED' : 'COMPLIANT'
            }))
        };
    }

    async getCostOptimization(reqModel: IdRequestModel): Promise<any> {
        const companyId = reqModel.id;
        const licenses = await this.repo.find({ where: companyId ? { companyId } : {} });

        const unusedLicenses = licenses.filter(l => !l.assignedEmployeeId);
        const potentialSavings = unusedLicenses.reduce((sum, l) => sum + (Number(l.costPerSeat || 0) * (l.totalSeats || 1)), 0);

        return {
            status: true,
            data: {
                unusedCount: unusedLicenses.length,
                potentialSavings
            }
        };
    }

    /**
     * Create a new license assignment
     * Assigns a software license to an employee
     * 
     * @param reqModel - License assignment creation data
     * @returns GlobalResponse indicating creation success
     */
    async createLicense(reqModel: CreateLicenseModel, userId?: number, ipAddress?: string): Promise<GlobalResponse> {
        const licenseData: Partial<CompanyLicenseEntity> = {
            companyId: reqModel.companyId,
            applicationId: reqModel.applicationId,
            assignedEmployeeId: reqModel.assignedEmployeeId,
            licenseKey: reqModel.licenseKey,
            purchaseDate: reqModel.purchaseDate,
            assignedDate: reqModel.assignedDate,
            expiryDate: reqModel.expiryDate,
            remarks: reqModel.remarks,
            totalSeats: reqModel.seats || 1,
            costPerSeat: (reqModel as any).costPerSeat,
            billingCycle: (reqModel as any).billingCycle,
            role: reqModel.role || null
        };

        const license = this.repo.create(licenseData);
        const saved = await this.repo.save(license);
        // ... existing notification logic

        // Persistent notification for employee
        try {
            if (reqModel.assignedEmployeeId) {
                const employee = await this.repo.manager.getRepository(EmployeesEntity).findOne({ where: { id: reqModel.assignedEmployeeId } });
                if (employee && employee.userId) {
                    const app = await this.repo.manager.getRepository(LicensesMasterEntity).findOne({ where: { id: reqModel.applicationId } });
                    await this.notificationsService.createNotification(employee.userId, {
                        title: 'License Assigned',
                        message: `A new license for ${app ? app.name : 'software'} has been assigned to you.`,
                        type: NotificationType.SUCCESS,
                        category: 'license',
                        metadata: { licenseId: saved.id }
                    });
                }
            }
        } catch (e) { console.error("License notification failed", e); }

        try {
            await this.licenseMasterService.updateUsedCount(reqModel.applicationId);
        } catch (e) {
            console.error('Failed to sync license usage count', e);
        }

        return new GlobalResponse(true, 201, 'License assigned successfully');
    }

    /**
     * Update an existing license assignment
     * Modifies license details such as expiry date or assigned employee
     * 
     * @param reqModel - License update data with ID
     * @returns GlobalResponse indicating update success
     */
    async updateLicense(reqModel: UpdateLicenseModel, userId?: number, ipAddress?: string): Promise<GlobalResponse> {
        const updateData: Partial<CompanyLicenseEntity> = {
            applicationId: reqModel.applicationId,
            assignedEmployeeId: reqModel.assignedEmployeeId,
            licenseKey: reqModel.licenseKey,
            purchaseDate: reqModel.purchaseDate,
            assignedDate: reqModel.assignedDate,
            expiryDate: reqModel.expiryDate,
            remarks: reqModel.remarks,
            costPerSeat: reqModel.costPerSeat,
            billingCycle: reqModel.billingCycle,
            role: reqModel.role || null
        };

        await this.repo.update(reqModel.id, updateData);

        try {
            await this.licenseMasterService.updateUsedCount(reqModel.applicationId);
        } catch (e) {
            console.error('Failed to sync license usage count', e);
        }

        return new GlobalResponse(true, 200, 'License updated successfully');
    }

    /**
     * Remove a license assignment
     * Permanently deletes license assignment from database
     * 
     * @param reqModel - Delete request with license ID
     * @returns GlobalResponse indicating deletion success
     */
    async deleteLicense(reqModel: DeleteLicenseModel, userId?: number, ipAddress?: string): Promise<GlobalResponse> {
        const license = await this.repo.findOne({ where: { id: reqModel.id } });
        await this.repo.delete(reqModel.id);

        if (license) {
            try {
                await this.licenseMasterService.updateUsedCount(license.applicationId);
            } catch (e) {
                console.error('Failed to sync license usage count', e);
            }
        }

        return new GlobalResponse(true, 200, 'License removed successfully');
    }
}
