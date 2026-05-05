import { Column, Entity } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';

@Entity('ticket_messages')
export class TicketMessageEntity extends CommonBaseEntity {
    @Column('bigint', { name: 'ticket_id', nullable: true })
    ticketId: number;

    @Column('bigint', { name: 'sender_id', nullable: false })
    senderId: number;

    @Column('varchar', { name: 'sender_type', length: 20, nullable: false, comment: 'user or support' })
    senderType: string;

    @Column('text', { name: 'message', nullable: false })
    message: string;

    @Column('json', { name: 'attachments', nullable: true, comment: 'Array of attachment metadata [{name, url, type, size}]' })
    attachments: any;
}
