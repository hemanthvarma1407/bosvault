import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponse, NotificationPayload } from '@bosvault/shared-models';
import { AxiosRequestConfig } from 'axios';

export class NotificationsService extends CommonAxiosService {
    private getURL(childUrl: string) {
        return '/notifications/' + childUrl;
    }

    async getNotifications(config?: AxiosRequestConfig): Promise<GlobalResponse & { data: NotificationPayload[] }> {
        return await this.axiosGetCall(this.getURL('user'), config);
    }

    async getUnreadCount(config?: AxiosRequestConfig): Promise<GlobalResponse & { data: number }> {
        return await this.axiosGetCall(this.getURL('unread'), config);
    }

    async markAsRead(id: string, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL(`read/${id}`), {}, config);
    }

    async markAllAsRead(config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('read-all'), {}, config);
    }

    async deleteNotification(id: string, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosDeleteCall(this.getURL(id), config);
    }
}
