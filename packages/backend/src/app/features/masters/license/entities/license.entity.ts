import { Column, Entity } from 'typeorm';
import { MasterBaseEntity } from '../../../../../database/master-base.entity';

@Entity('license_masters')
export class LicensesMasterEntity extends MasterBaseEntity {
    @Column('varchar', { name: 'name', length: 255, nullable: false, comment: 'License name' })
    name: string;

    @Column('text', { name: 'description', nullable: true, comment: 'License description' })
    description: string;

    @Column('boolean', { name: 'is_active', nullable: false, default: true, comment: 'Whether license is active' })
    isActive: boolean;

    @Column('date', { name: 'purchase_date', nullable: true, comment: 'License pushase date' })
    purchaseDate: Date;

    @Column('date', { name: 'expiry_date', nullable: true, comment: 'License expiry date' })
    expiryDate: Date;

    @Column('int', { name: 'total_quantity', default: 0, nullable: true, comment: 'Total number of licenses available' })
    totalQuantity: number;

    @Column('int', { name: 'used_count', default: 0, nullable: true, comment: 'Total number of licenses assigned to members' })
    usedCount: number;
}
