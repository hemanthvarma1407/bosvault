/**
 * WebSocket Event Types
 * Defines all real-time events used across the application
 */
export enum WebSocketEvent {
    // Connection events
    CONNECTION = 'connection',
    DISCONNECT = 'disconnect',
    ERROR = 'error',

    // Notification events
    NOTIFICATION = 'notification',
    NOTIFICATION_READ = 'notification:read',
    NOTIFICATION_CLEAR = 'notification:clear',

    // Dashboard events
    DASHBOARD_UPDATE = 'dashboard:update',
    STATS_UPDATE = 'stats:update',

    // Ticket events
    TICKET_CREATED = 'ticket:created',
    TICKET_UPDATED = 'ticket:updated',
    TICKET_ASSIGNED = 'ticket:assigned',
    TICKET_RESOLVED = 'ticket:resolved',
    TICKET_COMMENTED = 'ticket:commented',

    // Asset events
    ASSET_CREATED = 'asset:created',
    ASSET_UPDATED = 'asset:updated',
    ASSET_ASSIGNED = 'asset:assigned',

    // User events
    USER_STATUS = 'user:status',
    USER_ONLINE = 'user:online',
    USER_OFFLINE = 'user:offline',

    // System events
    SYSTEM_ALERT = 'system:alert',
    SYSTEM_MAINTENANCE = 'system:maintenance',



    // Network monitoring events
    NETWORK_STATS_UPDATE = 'network:stats:update',
    NETWORK_METRICS = 'network:metrics',
    NETWORK_HEALTH_CHANGE = 'network:health:change',
    CONNECTION_EVENT = 'network:connection:event',
}

/**
 * Notification Types
 */
export enum NotificationType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
}

/**
 * Base WebSocket Payload
 */
export class WebSocketPayload {
    timestamp: Date;
    userId?: number;
    companyId?: number;

    constructor(timestamp: Date, userId?: number, companyId?: number) {
        this.timestamp = timestamp;
        this.userId = userId;
        this.companyId = companyId;
    }
}

/**
 * Notification Payload
 */
export class NotificationPayload extends WebSocketPayload {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    icon?: string;
    read: boolean;

    constructor(
        timestamp: Date,
        id: string,
        type: NotificationType,
        title: string,
        message: string,
        read: boolean,
        userId?: number,
        companyId?: number,
        link?: string,
        icon?: string
    ) {
        super(timestamp, userId, companyId);
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.read = read;
        this.link = link;
        this.icon = icon;
    }
}

/**
 * Dashboard Update Payload
 */
export class DashboardUpdatePayload extends WebSocketPayload {
    metric: string;
    value: number | string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';

    constructor(
        timestamp: Date,
        metric: string,
        value: number | string,
        userId?: number,
        companyId?: number,
        change?: number,
        trend?: 'up' | 'down' | 'stable'
    ) {
        super(timestamp, userId, companyId);
        this.metric = metric;
        this.value = value;
        this.change = change;
        this.trend = trend;
    }
}

/**
 * Ticket Event Payload
 */
export class TicketEventPayload extends WebSocketPayload {
    ticketId: number;
    ticketNumber: string;
    title: string;
    status?: string;
    priority?: string;
    assignedTo?: number;
    assignedToName?: string;
    comment?: string;

    constructor(
        timestamp: Date,
        ticketId: number,
        ticketNumber: string,
        title: string,
        userId?: number,
        companyId?: number,
        status?: string,
        priority?: string,
        assignedTo?: number,
        assignedToName?: string,
        comment?: string
    ) {
        super(timestamp, userId, companyId);
        this.ticketId = ticketId;
        this.ticketNumber = ticketNumber;
        this.title = title;
        this.status = status;
        this.priority = priority;
        this.assignedTo = assignedTo;
        this.assignedToName = assignedToName;
        this.comment = comment;
    }
}

/**
 * Asset Event Payload
 */
export class AssetEventPayload extends WebSocketPayload {
    assetId: number;
    assetTag: string;
    assetName: string;
    assetType?: string;
    assignedTo?: number;
    assignedToName?: string;

    constructor(
        timestamp: Date,
        assetId: number,
        assetTag: string,
        assetName: string,
        userId?: number,
        companyId?: number,
        assetType?: string,
        assignedTo?: number,
        assignedToName?: string
    ) {
        super(timestamp, userId, companyId);
        this.assetId = assetId;
        this.assetTag = assetTag;
        this.assetName = assetName;
        this.assetType = assetType;
        this.assignedTo = assignedTo;
        this.assignedToName = assignedToName;
    }
}

/**
 * System Alert Payload
 */
export class SystemAlertPayload extends WebSocketPayload {
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    action?: string;
    actionUrl?: string;

    constructor(
        timestamp: Date,
        severity: 'low' | 'medium' | 'high' | 'critical',
        title: string,
        message: string,
        userId?: number,
        companyId?: number,
        action?: string,
        actionUrl?: string
    ) {
        super(timestamp, userId, companyId);
        this.severity = severity;
        this.title = title;
        this.message = message;
        this.action = action;
        this.actionUrl = actionUrl;
    }
}



/**
 * WebSocket Room Types
 */
export enum WebSocketRoom {
    USER = 'user',
    COMPANY = 'company',
    ROLE = 'role',
    GLOBAL = 'global',
}

/**
 * Helper to generate room names
 */
export class WebSocketRoomHelper {
    static getUserRoom(userId: number): string {
        return `${WebSocketRoom.USER}:${userId}`;
    }

    static getCompanyRoom(companyId: number): string {
        return `${WebSocketRoom.COMPANY}:${companyId}`;
    }

    static getRoleRoom(roleId: number): string {
        return `${WebSocketRoom.ROLE}:${roleId}`;
    }

    static getGlobalRoom(): string {
        return WebSocketRoom.GLOBAL;
    }
}
