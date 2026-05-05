import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AssetNextAssignmentEntity } from '../entities/asset-next-assignment.entity';
import { NextAssignmentStatusEnum, GetNextAssignmentsRequestModel } from '@bosvault/shared-models';

@Injectable()
export class AssetNextAssignmentRepository extends Repository<AssetNextAssignmentEntity> {
    constructor(private dataSource: DataSource) {
        super(AssetNextAssignmentEntity, dataSource.createEntityManager());
    }

    async getNextAssignments(reqModel: GetNextAssignmentsRequestModel) {
        const companyId = reqModel.companyId;
        return await this.createQueryBuilder('assignment')
            .leftJoin('employees', 'employee', 'assignment.employee_id = employee.id')
            .leftJoin('asset_info', 'asset', 'assignment.assigned_asset_id = asset.id')
            .leftJoin('device_info', 'device', 'asset.device_id = device.id')
            .where('assignment.companyId = :companyId', { companyId })
            .andWhere('assignment.status != :cancelled', { cancelled: NextAssignmentStatusEnum.CANCELLED })
            .select([
                'assignment.id as id',
                'CONCAT(employee.firstName, \' \', employee.lastName) as employeeName',
                'employee.designation as employeeRole',
                'assignment.assetType as assetType',
                'assignment.requestDate as requestDate',
                'assignment.expectedDate as expectedDate',
                'assignment.assignedAssetId as assignedAssetId',
                'device.deviceName as assignedAssetName',
                'assignment.status as status',
                'assignment.priority as priority',
                'assignment.remarks as remarks'
            ])
            .orderBy('assignment.priority', 'DESC')
            .addOrderBy('assignment.requestDate', 'ASC')
            .getRawMany();
    }
}
