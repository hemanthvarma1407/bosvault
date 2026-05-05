import { Column, Entity, Index } from 'typeorm';
import { AssignmentPriorityEnum, NextAssignmentStatusEnum } from '@bosvault/shared-models';
import { CommonBaseEntity } from '../../../../database/common-base.entity';

@Entity('asset_next_assignment')
export class AssetNextAssignmentEntity extends CommonBaseEntity {
    @Column('bigint', { name: 'employee_id', nullable: false, comment: 'Reference to employees table - who will receive the asset' })
    employeeId: number;

    @Column('varchar', { name: 'asset_type', length: 100, nullable: false, comment: 'Type of asset needed (Laptop/Desktop/Monitor/etc)' })
    assetType: string;

    @Column('date', { name: 'request_date', nullable: false, comment: 'Date when assignment request was made' })
    requestDate: Date;

    @Column('date', { name: 'expected_date', nullable: true, comment: 'Expected date for asset assignment' })
    expectedDate: Date;

    @Column('bigint', { name: 'assigned_asset_id', nullable: true, comment: 'Reference to asset_info table - asset allocated' })
    assignedAssetId: number;

    @Column('enum', { name: 'status', enum: NextAssignmentStatusEnum, default: NextAssignmentStatusEnum.PENDING, nullable: false, comment: 'Current status of assignment request' })
    status: NextAssignmentStatusEnum;

    @Column('enum', { name: 'priority', enum: AssignmentPriorityEnum, default: AssignmentPriorityEnum.MEDIUM, nullable: true, comment: 'Priority level of assignment' })
    priority: AssignmentPriorityEnum;

    @Column('text', { name: 'remarks', nullable: true, comment: 'Additional remarks about the assignment request' })
    remarks: string;

    @Column('bigint', { name: 'requested_by_id', nullable: true, comment: 'Reference to user who created the request' })
    requestedById: number;
}
