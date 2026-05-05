import { Column, Entity } from 'typeorm';
import { MasterBaseEntity } from '../../../../../database/master-base.entity';

@Entity('device_configs')
export class DeviceConfigEntity extends MasterBaseEntity {

    @Column('varchar', { name: 'laptop_company', length: 255, nullable: false, comment: 'Laptop Company' })
    laptopCompany: string;

    @Column('varchar', { name: 'model', length: 255, nullable: true, comment: 'Device Model' })
    model: string;

    @Column('boolean', { name: 'is_active', nullable: false, default: true, comment: 'Whether config is active' })
    isActive: boolean;

    @Column('varchar', { name: 'configuration', length: 500, nullable: true, comment: 'Device Configuration' })
    configuration: string;

    @Column('varchar', { name: 'ram', length: 100, nullable: true, comment: 'RAM' })
    ram: string;

    @Column('varchar', { name: 'storage', length: 100, nullable: true, comment: 'Storage' })
    storage: string;

    @Column('varchar', { name: 'asset_type', length: 255, nullable: true, comment: 'Asset Type (Laptop, Desktop, etc)' })
    assetType: string;
}
