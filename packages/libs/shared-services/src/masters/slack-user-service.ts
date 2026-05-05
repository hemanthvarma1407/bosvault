import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';
import { CreateSlackUserModel, GetAllSlackUsersResponseModel, IdRequestModel, UpdateSlackUserModel, GlobalResponse } from '@bosvault/shared-models';

export class SlackUserService extends CommonAxiosService {
    private getURL(childUrl: string) {
        return '/slack-users/' + childUrl;
    }

    async getAllSlackUsers(config?: AxiosRequestConfig): Promise<GetAllSlackUsersResponseModel> {
        return await this.axiosPostCall(this.getURL('getAllSlackUsers'), {}, config);
    }

    async importSlackUsers(companyId?: number, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('importSlackUsers'), { companyId }, config);
    }

    async createSlackUser(reqModel: CreateSlackUserModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('createSlackUser'), reqModel, config);
    }

    async updateSlackUser(reqModel: UpdateSlackUserModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('updateSlackUser'), reqModel, config);
    }

    async deleteSlackUser(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('deleteSlackUser'), reqModel, config);
    }
}
