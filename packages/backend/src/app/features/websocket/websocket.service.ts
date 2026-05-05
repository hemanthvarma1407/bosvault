import { Injectable, Logger } from '@nestjs/common';
import { AppWebSocketGateway } from './websocket.gateway';
import { WebSocketEvent, WebSocketRoomHelper, NotificationPayload, DashboardUpdatePayload, TicketEventPayload, AssetEventPayload, SystemAlertPayload, } from '@bosvault/shared-models';


@Injectable()
export class WebSocketService {
    private readonly logger = new Logger(WebSocketService.name);
    constructor(private readonly gateway: AppWebSocketGateway) { }

    /**
     * Emit event to a specific user
     */
    emitToUser(userId: number, event: WebSocketEvent | string, data: any): void {
        try {
            const room = WebSocketRoomHelper.getUserRoom(userId);
            this.gateway.server.to(room).emit(event, {
                ...data,
                timestamp: new Date(),
            });
            this.logger.debug(`Emitted ${event} to user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to emit to user ${userId}: ${error.message}`);
        }
    }

    /**
     * Emit event to all users in a company
     */
    emitToCompany(companyId: number, event: WebSocketEvent | string, data: any): void {
        try {
            const room = WebSocketRoomHelper.getCompanyRoom(companyId);
            this.gateway.server.to(room).emit(event, {
                ...data,
                timestamp: new Date(),
            });
            this.logger.debug(`Emitted ${event} to company ${companyId}`);
        } catch (error) {
            this.logger.error(`Failed to emit to company ${companyId}: ${error.message}`);
        }
    }

    /**
     * Emit event to all users with a specific role
     */
    emitToRole(roleId: number, event: WebSocketEvent | string, data: any): void {
        try {
            const room = WebSocketRoomHelper.getRoleRoom(roleId);
            this.gateway.server.to(room).emit(event, {
                ...data,
                timestamp: new Date(),
            });
            this.logger.debug(`Emitted ${event} to role ${roleId}`);
        } catch (error) {
            this.logger.error(`Failed to emit to role ${roleId}: ${error.message}`);
        }
    }

    /**
     * Emit event to all connected clients
     */
    emitGlobal(event: WebSocketEvent | string, data: any): void {
        try {
            this.gateway.server.emit(event, { ...data, timestamp: new Date(), });
            this.logger.debug(`Emitted ${event} globally`);
        } catch (error) {
            this.logger.error(`Failed to emit globally: ${error.message}`);
        }
    }

    /**
     * Send notification to user
     */
    sendNotification(userId: number, notification: Omit<NotificationPayload, 'timestamp'>): void {
        this.emitToUser(userId, WebSocketEvent.NOTIFICATION, notification);
    }

    /**
     * Send dashboard update to user
     */
    sendDashboardUpdate(userId: number, update: Omit<DashboardUpdatePayload, 'timestamp'>): void {
        this.emitToUser(userId, WebSocketEvent.DASHBOARD_UPDATE, update);
    }

    /**
     * Broadcast dashboard update to company
     */
    broadcastDashboardUpdate(companyId: number, update: Omit<DashboardUpdatePayload, 'timestamp'>): void {
        this.emitToCompany(companyId, WebSocketEvent.DASHBOARD_UPDATE, update);
    }

    /**
     * Notify about ticket creation
     */
    notifyTicketCreated(userId: number, ticket: Omit<TicketEventPayload, 'timestamp'>): void {
        this.emitToUser(userId, WebSocketEvent.TICKET_CREATED, ticket);
    }

    /**
     * Notify about ticket update
     */
    notifyTicketUpdated(userId: number, ticket: Omit<TicketEventPayload, 'timestamp'>): void {
        this.emitToUser(userId, WebSocketEvent.TICKET_UPDATED, ticket);
    }

    /**
     * Notify about ticket assignment
     */
    notifyTicketAssigned(userId: number, ticket: Omit<TicketEventPayload, 'timestamp'>): void {
        this.emitToUser(userId, WebSocketEvent.TICKET_ASSIGNED, ticket);
    }

    /**
     * Notify about asset assignment
     */
    notifyAssetAssigned(userId: number, asset: Omit<AssetEventPayload, 'timestamp'>): void {
        this.emitToUser(userId, WebSocketEvent.ASSET_ASSIGNED, asset);
    }

    /**
     * Broadcast system alert
     */
    broadcastSystemAlert(alert: Omit<SystemAlertPayload, 'timestamp'>): void {
        this.emitGlobal(WebSocketEvent.SYSTEM_ALERT, alert);
    }

    /**
     * Broadcast system alert to company
     */
    broadcastSystemAlertToCompany(companyId: number, alert: Omit<SystemAlertPayload, 'timestamp'>): void {
        this.emitToCompany(companyId, WebSocketEvent.SYSTEM_ALERT, alert);
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId: number): boolean {
        return this.gateway.isUserOnline(userId);
    }

    /**
     * Get connected users count
     */
    getConnectedUsersCount(): number {
        return this.gateway.getConnectedUsersCount();
    }
}
