import { Column, Entity } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';

@Entity('asset_return_history')
export class AssetReturnHistoryEntity extends CommonBaseEntity {
    @Column('bigint', { name: 'asset_id', nullable: false, comment: 'Reference to asset_info table' })
    assetId: number;

    @Column('bigint', { name: 'employee_id', nullable: false, comment: 'Reference to employees table - who returned the asset' })
    employeeId: number;

    @Column('date', { name: 'return_date', nullable: false, comment: 'Date when asset was returned' })
    returnDate: Date;

    @Column('text', { name: 'return_reason', nullable: true, comment: 'Reason for returning the asset' })
    returnReason: string;

    @Column('varchar', { name: 'asset_condition', length: 50, nullable: true, comment: 'Condition of asset on return (Good/Fair/Poor)' })
    assetCondition: string;

    @Column('text', { name: 'remarks', nullable: true, comment: 'Additional remarks about the return' })
    remarks: string;

    @Column('date', { name: 'allocation_date', nullable: true, comment: 'Original allocation date for reference' })
    allocationDate: Date | null;
}
