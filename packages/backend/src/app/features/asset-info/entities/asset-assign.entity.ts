import { Column, Entity } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';

@Entity('asset_assign')
export class AssetAssignEntity extends CommonBaseEntity {
    @Column('bigint', { name: 'asset_id', nullable: false, comment: 'Reference to asset_info table' })
    assetId: number;

    @Column('bigint', { name: 'employee_id', nullable: false, comment: 'Reference to employees table' })
    employeeId: number;

    @Column('bigint', { name: 'assigned_by_id', nullable: false, comment: 'Reference to it_admin table' })
    assignedById: number;

    @Column('date', { name: 'assigned_date', nullable: false, comment: 'Date when asset was assigned' })
    assignedDate: Date;

    @Column('date', { name: 'return_date', nullable: true, comment: 'Date when asset was returned' })
    returnDate: Date;

    @Column('boolean', { name: 'is_current', default: true, comment: 'Whether this is the current assignment' })
    isCurrent: boolean;

    @Column('text', { name: 'remarks', nullable: true, comment: 'Additional remarks about assignment' })
    remarks: string;

    @Column('text', { name: 'return_remarks', nullable: true, comment: 'Remarks when asset was returned' })
    returnRemarks: string;
}
