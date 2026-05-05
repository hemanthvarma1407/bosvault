import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AssetReturnHistoryEntity } from '../entities/asset-return-history.entity';
import { GetReturnAssetsRequestModel } from '@bosvault/shared-models';

@Injectable()
export class AssetReturnHistoryRepository extends Repository<AssetReturnHistoryEntity> {
    constructor(private dataSource: DataSource) {
        super(AssetReturnHistoryEntity, dataSource.createEntityManager());
    }

    async getReturnAssets(reqModel: GetReturnAssetsRequestModel) {
        const query = this.createQueryBuilder('returnHistory')
            .leftJoin('employees', 'employee', 'returnHistory.employee_id = employee.id')
            .leftJoin('asset_info', 'asset', 'returnHistory.asset_id = asset.id')
            .leftJoin('device_info', 'device', 'asset.device_id = device.id')
            .where('returnHistory.companyId = :companyId', { companyId: reqModel.companyId });

        if (reqModel.startDate && reqModel.endDate) {
            query.andWhere('returnHistory.returnDate BETWEEN :startDate AND :endDate', {
                startDate: reqModel.startDate,
                endDate: reqModel.endDate
            });
        }

        if (reqModel.employeeId) {
            query.andWhere('returnHistory.employeeId = :employeeId', { employeeId: reqModel.employeeId });
        }

        return await query.select([
            'returnHistory.id as id',
            'CONCAT(employee.firstName, \' \', employee.lastName) as employeeName',
            'employee.designation as employeeRole',
            'device.deviceName as deviceType',
            'asset.configuration as configuration',
            'returnHistory.allocationDate as allocationDate',
            'returnHistory.returnDate as returnDate',
            'returnHistory.returnReason as returnReason',
            'returnHistory.assetCondition as assetCondition',
            'returnHistory.assetId as assetId',
            'asset.serialNumber as serialNumber'
        ]).getRawMany();
    }
}
