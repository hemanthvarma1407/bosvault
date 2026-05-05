import { Column, Entity, Index } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';
import { CommentByEnum } from '@bosvault/shared-models';

@Entity('ticket_comments')
export class TicketCommentsEntity extends CommonBaseEntity {
    @Column('bigint', { name: 'ticket_id', nullable: false, comment: 'Reference to tickets table' })
    ticketId: number;

    @Column('text', { name: 'comment', nullable: false, comment: 'Comment text' })
    comment: string;

    @Column('enum', { name: 'comment_by', enum: CommentByEnum, nullable: false, comment: 'Who made the comment' })
    commentBy: CommentByEnum;

    @Column('bigint', { name: 'commented_by_id', nullable: false, comment: 'ID of the person who commented' })
    commentedById: number;
}
