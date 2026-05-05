import { Column, Entity } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';
import { EmailTypeEnum, EmailStatusEnum } from '@bosvault/shared-models';

@Entity('email_info')
export class EmailInfoEntity extends CommonBaseEntity {
    @Column('varchar', { name: 'email', length: 255, nullable: false, unique: true, comment: 'Email address' })
    email: string;

    @Column('enum', { name: 'email_type', enum: EmailTypeEnum, nullable: false, comment: 'Type of email' })
    emailType: EmailTypeEnum;

    @Column('varchar', { name: 'department', length: 255, nullable: true, comment: 'Department associated with email' })
    department: string;

    @Column('bigint', { name: 'employee_id', nullable: true, comment: 'Reference to employees table' })
    employeeId: number;

    @Column('enum', { name: 'status', enum: EmailStatusEnum, default: EmailStatusEnum.ACTIVE, nullable: false, comment: 'Email account status' })
    status: EmailStatusEnum;

    @Column('simple-array', { name: 'member_ids', nullable: true, comment: 'Member employee IDs for group emails' })
    memberIds: string[];

    @Column('varchar', { name: 'name', length: 255, nullable: true, comment: 'Name/Title of the email account' })
    name: string;

    @Column('decimal', { name: 'billing', precision: 10, scale: 2, nullable: true, comment: 'Billing amount associated' })
    billing: number;

    @Column('timestamp', { name: 'created_date', nullable: true, comment: 'Date the email was created' })
    createdDate: Date;

    @Column('text', { name: 'description', nullable: true, comment: 'Account description' })
    description: string;
}
