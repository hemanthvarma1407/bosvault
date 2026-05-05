import { Column, Entity } from 'typeorm';
import { MasterBaseEntity } from '../../../../../database/master-base.entity';

@Entity('credential_vault')
export class CredentialVaultEntity extends MasterBaseEntity {
    @Column('varchar', { name: 'app_name', length: 255, nullable: false, comment: 'App Name' })
    appName: string;

    @Column('text', { name: 'description', nullable: true, comment: 'Description' })
    description: string;

    @Column('varchar', { name: 'password', length: 255, nullable: false, comment: 'Password' })
    password: string;

    @Column('varchar', { name: 'expire_date', nullable: true, comment: 'Expire Date' })
    expireDate: Date;

    @Column('varchar', { name: 'owner', length: 100, nullable: false, comment: 'Owner / Username' })
    owner: string;

    @Column('varchar', { name: 'device_serial_number', length: 255, nullable: true, comment: 'Device Serial Number' })
    deviceSerialNumber: string;

    @Column('varchar', { name: 'ip_address', length: 50, nullable: true, comment: 'IP Address' })
    ipAddress: string;

    @Column('varchar', { name: 'recovery_email', length: 255, nullable: true, comment: 'Recovery Email' })
    recoveryEmail: string;

    @Column('boolean', { name: 'is_active', nullable: false, default: true, comment: 'Active Logic' })
    isActive: boolean;
}
