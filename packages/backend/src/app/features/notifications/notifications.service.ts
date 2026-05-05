import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationEntity } from './entities/notification.entity';
import { WebSocketService } from '../websocket/websocket.service';
import { NotificationType, GlobalResponse } from '@bosvault/shared-models';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly notificationsRepo: NotificationRepository,
        private readonly webSocketService: WebSocketService,
    ) { }

    async createNotification(
        userId: number,
        data: {
            title: string;
            message: string;
            type?: NotificationType;
            category?: string;
            link?: string;
            icon?: string;
            metadata?: any;
        }
    ): Promise<NotificationEntity> {
        const notification = new NotificationEntity();
        notification.userId = userId;
        notification.title = data.title;
        notification.message = data.message;
        notification.type = data.type || NotificationType.INFO;
        notification.category = data.category;
        notification.link = data.link;
        notification.icon = data.icon;
        notification.metadata = data.metadata;
        notification.isRead = false;

        const saved = await this.notificationsRepo.save(notification);

        // Also emit via WebSocket for real-time update
        this.webSocketService.sendNotification(userId, {
            id: saved.id.toString(),
            type: saved.type,
            title: saved.title,
            message: saved.message,
            link: saved.link,
            icon: saved.icon,
            read: saved.isRead,
            userId: saved.userId,
            companyId: undefined, // Add if needed
        });

        return saved;
    }

    async getByUser(userId: number, limit = 50, offset = 0): Promise<NotificationEntity[]> {
        return this.notificationsRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async getUnreadCount(userId: number): Promise<number> {
        return this.notificationsRepo.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(id: number, userId: number): Promise<GlobalResponse> {
        await this.notificationsRepo.update({ id, userId }, { isRead: true });
        return new GlobalResponse(true, 200, 'Notification marked as read');
    }

    async markAllRead(userId: number): Promise<GlobalResponse> {
        await this.notificationsRepo.update({ userId, isRead: false }, { isRead: true });
        return new GlobalResponse(true, 200, 'All notifications marked as read');
    }

    async deleteNotification(id: number, userId: number): Promise<GlobalResponse> {
        await this.notificationsRepo.delete({ id, userId });
        return new GlobalResponse(true, 200, 'Notification deleted');
    }
}
