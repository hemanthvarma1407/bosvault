import { SlackUserModel, CreateSlackUserModel, UpdateSlackUserModel, GlobalResponse } from '@bosvault/shared-models';
import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';

export class SlackUsersService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/slack-users/' + childUrl;
    }

    async getAllSlackUsers(config?: AxiosRequestConfig): Promise<{ status: boolean; slackUsers: SlackUserModel[] }> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllSlackUsers'), {}, config);
    }

    async importSlackUsers(config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('importSlackUsers'), {}, config);
    }

    async createSlackUser(data: CreateSlackUserModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createSlackUser'), data, config);
    }

    async updateSlackUser(data: UpdateSlackUserModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateSlackUser'), data, config);
    }

    async deleteSlackUser(data: { id: number; userId: number }, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteSlackUser'), data, config);
    }
}
