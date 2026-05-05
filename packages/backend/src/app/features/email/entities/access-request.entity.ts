import { AccessRequestStatus } from '@bosvault/shared-models';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('access_requests')
export class AccessRequestEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { name: 'name', length: 255, nullable: false, comment: 'Name of the applicant' })
    name: string;

    @Column('varchar', { name: 'email', length: 255, nullable: false, comment: 'Email of the applicant' })
    email: string;

    @Column('text', { name: 'description', nullable: true, comment: 'Request description/reason' })
    description: string;

    @Column('enum', { name: 'status', enum: AccessRequestStatus, default: AccessRequestStatus.PENDING, nullable: false, comment: 'Status of the request' })
    status: AccessRequestStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
