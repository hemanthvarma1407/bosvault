import { Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { AssetInfoEntity } from '../../asset-info/entities/asset-info.entity';
import { EmployeesEntity } from '../../employees/entities/employees.entity';
import { TicketsEntity } from '../../tickets/entities/tickets.entity';
import { CompanyLicenseEntity } from '../../licenses/entities/company-license.entity';
import { TicketStatusEnum, TicketPriorityEnum, POStatusEnum } from '@bosvault/shared-models';
import { PurchaseOrderEntity } from '../../procurement/entities/purchase-order.entity';
import { DepartmentsMasterEntity } from '../../masters/department/entities/department.entity';
import { LicensesMasterEntity } from '../../masters/license/entities/license.entity';

@Injectable()
export class DashboardRepository {
    constructor(private readonly dataSource: DataSource) { }

    async getAssetStats(companyId: number) {
        const repo = this.dataSource.getRepository(AssetInfoEntity);
        const where = companyId > 0 ? { companyId } : {};
        const total = await repo.count({ where });
        const query = repo.createQueryBuilder('asset').select('asset.asset_status_enum as status, COUNT(asset.id) as count');
        if (companyId > 0) {
            query.where('asset.company_id = :companyId', { companyId });
        }
        const byStatus = await query.groupBy('asset.asset_status_enum').getRawMany();
        return { total, byStatus };
    }

    async getTicketStats(companyId: number) {
        const repo = this.dataSource.getRepository(TicketsEntity);
        const where: any = companyId > 0 ? { companyId } : {};
        const total = await repo.count({ where });

        const statusQuery = repo.createQueryBuilder('ticket')
            .select('ticket.ticket_status as status, COUNT(ticket.id) as count');
        if (companyId > 0) {
            statusQuery.where('ticket.company_id = :companyId', { companyId });
        }
        const byStatus = await statusQuery.groupBy('ticket.ticket_status').getRawMany();

        const priorityQuery = repo.createQueryBuilder('ticket')
            .select('ticket.priority_enum as priority, COUNT(ticket.id) as count');
        if (companyId > 0) {
            priorityQuery.where('ticket.company_id = :companyId', { companyId });
        }
        const byPriority = await priorityQuery.groupBy('ticket.priority_enum').getRawMany();

        const recentQuery = repo.createQueryBuilder('ticket')
            .leftJoinAndMapOne('ticket.raisedByEmployee', EmployeesEntity, 'emp', 'emp.id = ticket.employeeId');
        if (companyId > 0) {
            recentQuery.where('ticket.company_id = :companyId', { companyId });
        }
        const recent = await recentQuery.orderBy('ticket.createdAt', 'DESC').take(5).getMany();

        const openCriticalWhere: any = { priorityEnum: In([TicketPriorityEnum.HIGH, TicketPriorityEnum.URGENT]), ticketStatus: Not(In([TicketStatusEnum.CLOSED, TicketStatusEnum.RESOLVED])) };
        if (companyId > 0) {
            openCriticalWhere.companyId = companyId;
        }
        const openCritical = await repo.count({ where: openCriticalWhere });

        return { total, byStatus, byPriority, recent, openCritical };
    }

    async getEmployeeStats(companyId: number) {
        const repo = this.dataSource.getRepository(EmployeesEntity);

        const query = repo.createQueryBuilder('emp')
            .leftJoin(DepartmentsMasterEntity, 'dept', 'dept.id = emp.department_id')
            .select('COALESCE(dept.name, \'Unassigned\') as department, COUNT(emp.id) as count');
        if (companyId > 0) {
            query.where('emp.company_id = :companyId', { companyId });
        }
        const byDept = await query.groupBy('COALESCE(dept.name, \'Unassigned\')').getRawMany();
        const total = byDept.reduce((sum, item) => sum + parseInt(item.count || '0'), 0);

        return { total, byDept };
    }

    async getLicenseStats(companyId: number) {
        const repo = this.dataSource.getRepository(CompanyLicenseEntity);
        const query = repo.createQueryBuilder('license')
            .leftJoin(LicensesMasterEntity, 'app', 'app.id = license.application_id')
            .leftJoin(EmployeesEntity, 'emp', 'emp.id = license.assigned_employee_id')
            .select([
                'license.id as id',
                'license.application_id as applicationId',
                'COALESCE(app.name, \'Software License\') as applicationName',
                'license.expiry_date as expiryDate',
                'license.assigned_date as assignedDate',
                'license.billing_cycle as billingCycle',
                'COALESCE(CONCAT(emp.first_name, \' \', emp.last_name), \'Unassigned\') as assignedTo',
                'license.assigned_employee_id as assignedEmployeeId'
            ]);

        if (companyId > 0) {
            query.where('license.company_id = :companyId', { companyId });
        }

        const expiring = await query
            .orderBy('license.expiry_date', 'ASC')
            .addOrderBy('license.created_at', 'DESC')
            .limit(10)
            .getRawMany();

        const total = await repo.count({ where: companyId > 0 ? { companyId } : {} });
        return { total, expiring };
    }

    async getProcurementStats(companyId: number) {
        const repo = this.dataSource.getRepository(PurchaseOrderEntity);
        const where: any = companyId > 0 ? { companyId } : {};

        const totalPOs = await repo.count({ where });

        const spendQuery = repo.createQueryBuilder('po').select('SUM(po.total_amount)', 'totalSpend')
            .where('po.status IN (:...statuses)', { statuses: [POStatusEnum.APPROVED, POStatusEnum.ORDERED, POStatusEnum.RECEIVED] });

        if (companyId > 0) {
            spendQuery.andWhere('po.company_id = :companyId', { companyId });
        }
        const spendResult = await spendQuery.getRawOne();
        const totalSpend = parseFloat(spendResult?.totalSpend || '0');

        const vendorQuery = repo.createQueryBuilder('po').select('COUNT(DISTINCT po.vendor_id)', 'activeVendors');
        if (companyId > 0) {
            vendorQuery.where('po.company_id = :companyId', { companyId });
        }
        const vendorResult = await vendorQuery.getRawOne();
        const activeVendors = parseInt(vendorResult?.activeVendors || '0');

        const recent = await repo.find({ where, order: { createdAt: 'DESC' }, take: 5 });
        return { totalPOs, totalSpend, activeVendors, recent };
    }
}
