import { Column, Entity } from 'typeorm';
import { MasterBaseEntity } from '../../../../../database/master-base.entity';

@Entity('remote_tools')
export class RemoteMasterEntity extends MasterBaseEntity {
    @Column('varchar', { name: 'remote_tool', length: 255, nullable: false, comment: 'Remote Tool Name' })
    remoteTool: string;

    @Column('varchar', { name: 'username', length: 255, nullable: false, comment: 'User ID / Username' })
    username: string;

    @Column('varchar', { name: 'user_fullname', length: 255, nullable: true, comment: 'Full name of the user' })
    userFullname: string;

    @Column('varchar', { name: 'device_serial_number', length: 255, nullable: true, comment: 'Serial Number' })
    deviceSerialNumber: string;

    @Column('varchar', { name: 'ip_address', length: 100, nullable: true, comment: 'IP Address' })
    ipAddress: string;

    @Column('varchar', { name: 'recovery_email', length: 255, nullable: true, comment: 'Recovery Email' })
    recoveryEmail: string;

    @Column('varchar', { name: 'password', length: 255, nullable: false, comment: 'Password' })
    password: string;

    @Column('text', { name: 'notes', nullable: true, comment: 'Description' })
    notes: string;

    @Column('boolean', { name: 'is_active', nullable: false, default: true, comment: 'Active Logic' })
    isActive: boolean;
}
