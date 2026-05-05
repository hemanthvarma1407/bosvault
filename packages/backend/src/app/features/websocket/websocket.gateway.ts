import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, MessageBody, ConnectedSocket, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WebSocketEvent, WebSocketRoomHelper } from '@bosvault/shared-models';

/**
 * WebSocket Gateway for real-time communication
 * Handles connections, authentication, and event broadcasting
 */
@WebSocketGateway({
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true, },
    namespace: '/ws',
})
export class AppWebSocketGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AppWebSocketGateway.name);
    private connectedUsers = new Map<number, Set<string>>(); // userId -> Set of socketIds

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Gateway initialization
     */
    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    /**
     * Handle new client connections
     */
    async handleConnection(client: Socket) {
        try {
            // Extract and verify JWT token
            const token = this.extractToken(client);
            if (!token) {
                this.logger.warn(`Connection rejected: No token provided`);
                client.disconnect();
                return;
            }

            // Verify token
            const payload = await this.verifyToken(token);
            if (!payload) {
                this.logger.warn(`Connection rejected: Invalid token`);
                client.disconnect();
                return;
            }

            // Store user data in socket
            client.data.userId = payload.sub;
            client.data.email = payload.email;
            client.data.companyId = payload.companyId;
            client.data.roleId = payload.roleId;

            // Join user-specific room
            const userRoom = WebSocketRoomHelper.getUserRoom(payload.sub);
            await client.join(userRoom);

            // Join company-specific room
            if (payload.companyId) {
                const companyRoom = WebSocketRoomHelper.getCompanyRoom(payload.companyId);
                await client.join(companyRoom);
            }

            // Join role-specific room
            if (payload.roleId) {
                const roleRoom = WebSocketRoomHelper.getRoleRoom(payload.roleId);
                await client.join(roleRoom);
            }

            // Track connected user
            if (!this.connectedUsers.has(payload.sub)) {
                this.connectedUsers.set(payload.sub, new Set());
            }
            this.connectedUsers.get(payload.sub)!.add(client.id);

            this.logger.log(
                `Client connected: ${client.id} | User: ${payload.email} (ID: ${payload.sub})`,
            );

            // Emit user online status
            this.server.to(userRoom).emit(WebSocketEvent.USER_ONLINE, {
                userId: payload.sub,
                timestamp: new Date(),
            });

            // Broadcast connection event
            this.server.emit(WebSocketEvent.CONNECTION_EVENT, {
                userId: payload.sub,
                username: payload.email.split('@')[0],
                email: payload.email,
                socketId: client.id,
                timestamp: new Date(),
                eventType: 'connected',
            });
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    /**
     * Handle client disconnections
     */
    async handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        const email = client.data.email;

        if (userId) {
            // Remove socket from user's connections
            const userSockets = this.connectedUsers.get(userId);
            if (userSockets) {
                userSockets.delete(client.id);

                // If no more connections for this user, mark as offline
                if (userSockets.size === 0) {
                    this.connectedUsers.delete(userId);

                    const userRoom = WebSocketRoomHelper.getUserRoom(userId);
                    this.server.to(userRoom).emit(WebSocketEvent.USER_OFFLINE, {
                        userId,
                        timestamp: new Date(),
                    });
                }
            }

            // Broadcast disconnection event
            if (email) {
                this.server.emit(WebSocketEvent.CONNECTION_EVENT, {
                    userId,
                    username: email.split('@')[0],
                    email,
                    socketId: client.id,
                    timestamp: new Date(),
                    eventType: 'disconnected',
                });
            }
        }

        this.logger.log(
            `Client disconnected: ${client.id} | User: ${email || 'Unknown'} (ID: ${userId || 'Unknown'})`,
        );
    }

    /**
     * Subscribe to notifications
     */
    @SubscribeMessage('subscribe:notifications')
    handleSubscribeNotifications(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        this.logger.log(`User ${userId} subscribed to notifications`);
        return { event: 'subscribed', data: { channel: 'notifications' } };
    }

    /**
     * Unsubscribe from notifications
     */
    @SubscribeMessage('unsubscribe:notifications')
    handleUnsubscribeNotifications(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        this.logger.log(`User ${userId} unsubscribed from notifications`);
        return { event: 'unsubscribed', data: { channel: 'notifications' } };
    }

    /**
     * Mark notification as read
     */
    @SubscribeMessage(WebSocketEvent.NOTIFICATION_READ)
    handleNotificationRead(
        @MessageBody() data: { notificationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        this.logger.log(`User ${userId} marked notification ${data.notificationId} as read`);
        // This would typically update the database
        return { event: 'notification:read:success', data };
    }

    /**
     * Ping/Pong for connection health check
     */
    @SubscribeMessage('ping')
    handlePing(
        @MessageBody() data: { sentAt: number },
        @ConnectedSocket() client: Socket,
    ) {
        return { event: 'pong', data: { timestamp: new Date(), sentAt: data.sentAt } };
    }

    /**
     * Extract JWT token from socket handshake
     */
    private extractToken(client: Socket): string | null {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Also check query params as fallback
        const token = client.handshake.auth?.token || client.handshake.query?.token;
        return token as string || null;
    }

    /**
     * Verify JWT token
     */
    private async verifyToken(token: string): Promise<any> {
        try {
            const secret = this.configService.get<string>('jwt.secret');
            return await this.jwtService.verifyAsync(token, { secret });
        } catch (error) {
            this.logger.error(`Token verification failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Get connected socket IDs for a user
     */
    getUserSockets(userId: number): Set<string> {
        return this.connectedUsers.get(userId) || new Set();
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId: number): boolean {
        return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
    }

    /**
     * Get count of connected users
     */
    getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }
}
