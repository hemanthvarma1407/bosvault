import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AuthUsersEntity } from '../../auth-users/entities/auth-users.entity';
import { NotificationType } from '@bosvault/shared-models';

@Entity('notifications')
export class NotificationEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(() => AuthUsersEntity)
    @JoinColumn({ name: 'userId' })
    user: AuthUsersEntity;

    @Column()
    title: string;

    @Column('text')
    message: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.INFO
    })
    type: NotificationType;

    @Column({ nullable: true })
    category: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    link: string;

    @Column({ nullable: true })
    icon: string;

    @Column({ type: 'json', nullable: true })
    metadata: any;

    @CreateDateColumn()
    createdAt: Date;
}
