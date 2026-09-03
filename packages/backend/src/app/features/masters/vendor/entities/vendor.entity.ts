import { Column, Entity, Index } from 'typeorm';
import { MasterBaseEntity } from '../../../../../database/master-base.entity';

@Entity('vendors')
@Index('idx_vendor_name', ['name'])
export class VendorsMasterEntity extends MasterBaseEntity {
    @Column('varchar', { name: 'name', length: 255, nullable: false, comment: 'Vendor name' })
    name: string;

    @Column('text', { name: 'description', nullable: true, comment: 'Vendor description' })
    description: string;

    @Column('boolean', { name: 'is_active', nullable: false, default: true, comment: 'Whether vendor is active' })
    isActive: boolean;

    @Column('varchar', { name: 'contact_person', length: 255, nullable: true, comment: 'Contact person name' })
    contactPerson: string;

    @Column('varchar', { name: 'email', length: 255, nullable: true, comment: 'Vendor email address' })
    email: string;

    @Column('varchar', { name: 'phone', length: 50, nullable: true, comment: 'Vendor phone number' })
    phone: string;

    @Column('text', { name: 'address', nullable: true, comment: 'Vendor address' })
    address: string;

    @Column('varchar', { name: 'category', length: 255, nullable: true, comment: 'Vendor category' })
    category: string;
}

export { VendorsMasterEntity as VendorEntity };
