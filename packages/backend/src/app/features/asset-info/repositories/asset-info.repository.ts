import { DataSource, Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { AssetInfoEntity } from "../entities/asset-info.entity";
import { AssetStatusEnum, IdRequestModel } from "@bosvault/shared-models";

@Injectable()
export class AssetInfoRepository extends Repository<AssetInfoEntity> {
    constructor(private dataSource: DataSource) {
        super(AssetInfoEntity, dataSource.createEntityManager());
    }

    async getStoreAssets(reqModel: IdRequestModel) {
        const companyId = reqModel.id;
        return await this.createQueryBuilder('asset')
            .leftJoin('asset_types', 'device', 'asset.device_id = device.id')
            .leftJoin('device_configs', 'brand', 'asset.device_config_id = brand.id')
            .leftJoin('employees', 'pastUser', 'asset.previous_user_employee_id = pastUser.id')
            .leftJoin('employees', 'presentUser', 'asset.assigned_to_employee_id = presentUser.id')
            .where('asset.companyId = :companyId', { companyId })
            .andWhere('asset.assetStatusEnum = :available', {
                available: AssetStatusEnum.AVAILABLE
            })
            .select([
                'asset.id as "id"',
                'device.name as "deviceName"',
                'COALESCE(NULLIF(asset.configuration, \'\'), brand.configuration) as "configuration"',
                'asset.serialNumber as "serialNumber"',
                'asset.boxNo as "boxNo"',
                'asset.assetStatusEnum as "assetStatusEnum"',
                'brand.laptop_company as "brandName"',
                'asset.model as "model"',
                'asset.warrantyExpiry as "warrantyExpiry"'
            ])
            .addSelect('CONCAT(pastUser.first_name, \' \', pastUser.last_name)', 'pastUserName')
            .addSelect('CONCAT(presentUser.first_name, \' \', presentUser.last_name)', 'presentUserName')
            .getRawMany();
    }

    async getAssetsWithAssignments(reqModel: IdRequestModel) {
        const companyId = reqModel.id;
        const query = this.createQueryBuilder('asset')
            .leftJoin('asset_types', 'device', 'asset.device_id = device.id')
            .leftJoin('asset_assign', 'assignment', 'asset.id = assignment.asset_id AND assignment.return_date IS NULL')
            .leftJoin('employees', 'employee', 'assignment.employee_id = employee.id')
            .leftJoin('employees', 'manager', 'employee.manager_id = manager.id')
            .leftJoin('employees', 'previousUser', 'asset.previous_user_employee_id = previousUser.id')
            .leftJoin('device_configs', 'brand', 'asset.device_config_id = brand.id')
            .select([
                'asset.id as "id"',
                'asset.companyId as "companyId"',
                'asset.deviceId as "deviceId"',
                'asset.deviceConfigId as "deviceConfigId"',
                'asset.model as "model"',
                'COALESCE(NULLIF(asset.configuration, \'\'), brand.configuration) as "configuration"',
                'asset.serialNumber as "serialNumber"',
                'asset.purchaseDate as "purchaseDate"',
                'asset.warrantyExpiry as "warrantyExpiry"',
                'asset.userAssignedDate as "userAssignedDate"',
                'asset.lastReturnDate as "lastReturnDate"',
                'asset.assignedToEmployeeId as "assignedToEmployeeId"',
                'asset.previousUserEmployeeId as "previousUserEmployeeId"',
                'asset.assetStatusEnum as "assetStatusEnum"',
                'asset.createdAt as "createdAt"',
                'asset.updatedAt as "updatedAt"',
                'device.name as "deviceName"',
                'brand.laptop_company as "brandName"'
            ])
            .addSelect('CONCAT(employee.first_name, \' \', employee.last_name)', 'assignedTo')
            .addSelect('CONCAT(manager.first_name, \' \', manager.last_name)', 'managerName')
            .addSelect('CONCAT(previousUser.first_name, \' \', previousUser.last_name)', 'previousUser')
            .addSelect('assignment.assigned_date', 'assignedDate')
            .addSelect('assignment.assigned_by_id', 'assignedById');

        if (companyId > 0) {
            query.where('asset.companyId = :companyId', { companyId });
        }

        const results = await query.orderBy('asset.createdAt', 'DESC').getRawMany();

        const uniqueResults = [];
        const seenIds = new Set();
        for (const row of results) {
            if (!seenIds.has(row.id)) {
                uniqueResults.push(row);
                seenIds.add(row.id);
            }
        }

        console.log(`[RAW-DEBUG-ASSIGN] results[0] configuration:`, uniqueResults[0]?.configuration ? 'EXISTS' : 'EMPTY');
        return uniqueResults;
    }

    async getAssetStatistics(reqModel: IdRequestModel) {
        const companyId = reqModel.id;
        const query = this.createQueryBuilder('asset')
            .select('asset.asset_status_enum', 'status')
            .addSelect('COUNT(*)', 'count');

        if (companyId > 0) {
            query.where('asset.company_id = :companyId', { companyId });
        }

        return await query.groupBy('asset.asset_status_enum').getRawMany();
    }

    async searchAssets(reqModel: import('@bosvault/shared-models').AssetSearchRequestModel) {
        const query = this.createQueryBuilder('asset')
            .leftJoin('asset_types', 'device', 'asset.device_id = device.id')
            .leftJoin('employees', 'employee', 'asset.assigned_to_employee_id = employee.id')
            .leftJoin('employees', 'manager', 'employee.manager_id = manager.id')
            .leftJoin('employees', 'previousUser', 'asset.previous_user_employee_id = previousUser.id')
            .leftJoin('device_configs', 'brand', 'asset.device_config_id = brand.id')
            .select([
                'asset.id as "id"',
                'asset.companyId as "companyId"',
                'asset.deviceId as "deviceId"',
                'asset.deviceConfigId as "deviceConfigId"',
                'asset.model as "model"',
                'COALESCE(NULLIF(asset.configuration, \'\'), brand.configuration) as "configuration"',
                'asset.serialNumber as "serialNumber"',
                'asset.purchaseDate as "purchaseDate"',
                'asset.warrantyExpiry as "warrantyExpiry"',
                'asset.userAssignedDate as "userAssignedDate"',
                'asset.lastReturnDate as "lastReturnDate"',
                'asset.assignedToEmployeeId as "assignedToEmployeeId"',
                'asset.previousUserEmployeeId as "previousUserEmployeeId"',
                'asset.assetStatusEnum as "assetStatusEnum"',
                'asset.createdAt as "createdAt"',
                'device.name as "deviceName"',
                'brand.laptop_company as "brandName"'
            ])
            .addSelect('CONCAT(employee.first_name, \' \', employee.last_name)', 'assignedTo')
            .addSelect('CONCAT(manager.first_name, \' \', manager.last_name)', 'managerName')
            .addSelect('CONCAT(previousUser.first_name, \' \', previousUser.last_name)', 'previousUser');

        if (reqModel.companyId > 0) {
            query.where('asset.companyId = :companyId', { companyId: reqModel.companyId });
        }

        if (reqModel.searchQuery) {
            query.andWhere(
                '(asset.serialNumber ILIKE :search OR device.name ILIKE :search)',
                { search: `%${reqModel.searchQuery}%` }
            );
        }

        if (reqModel.statusFilter && reqModel.statusFilter.length > 0) {
            const statuses = Array.isArray(reqModel.statusFilter) ? reqModel.statusFilter : [reqModel.statusFilter];
            query.andWhere('asset.assetStatusEnum IN (:...statuses)', { statuses });
        }

        if (reqModel.deviceConfigIds && reqModel.deviceConfigIds.length > 0) {
            query.andWhere('asset.deviceConfigId IN (:...deviceConfigIds)', { deviceConfigIds: reqModel.deviceConfigIds });
        }

        if (reqModel.assetTypeIds && reqModel.assetTypeIds.length > 0) {
            query.andWhere('asset.deviceId IN (:...assetTypeIds)', { assetTypeIds: reqModel.assetTypeIds });
        }

        if (reqModel.employeeId) {
            query.andWhere('asset.assignedToEmployeeId = :employeeId', { employeeId: reqModel.employeeId });
        }

        if (reqModel.purchaseDateFrom) {
            query.andWhere('asset.purchaseDate >= :purchaseDateFrom', { purchaseDateFrom: reqModel.purchaseDateFrom });
        }

        if (reqModel.purchaseDateTo) {
            query.andWhere('asset.purchaseDate <= :purchaseDateTo', { purchaseDateTo: reqModel.purchaseDateTo });
        }

        const results = await query.orderBy('asset.createdAt', 'DESC').getRawMany();
        console.log(`[RAW-DEBUG-SEARCH] results[0] configuration:`, results[0]?.configuration ? 'EXISTS' : 'EMPTY');
        return results;
    }
}
