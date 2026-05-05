import { Column, Entity, CreateDateColumn, Index } from 'typeorm';
import { TicketStatusEnum } from '@bosvault/shared-models';
import { CommonBaseEntity } from '../../../../database/common-base.entity';

@Entity('ticket_status_logs')
export class TicketStatusLogsEntity extends CommonBaseEntity {

    @Column('bigint', { name: 'ticket_id', nullable: false, comment: 'Reference to tickets table' })
    ticketId: number;

    @Column('enum', { name: 'old_status_enum', enum: TicketStatusEnum, nullable: false, comment: 'Previous ticket status' })
    oldStatusEnum: TicketStatusEnum;

    @Column('enum', { name: 'new_status_enum', enum: TicketStatusEnum, nullable: false, comment: 'New ticket status' })
    newStatusEnum: TicketStatusEnum;

    @Column('bigint', { name: 'changed_by_admin_id', nullable: false, comment: 'Reference to it_admin table' })
    changedByAdminId: number;

    @CreateDateColumn({ name: 'changed_at', type: 'timestamp', comment: 'Timestamp when status was changed' })
    changedAt: Date;
}
