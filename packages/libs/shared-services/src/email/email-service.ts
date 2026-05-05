import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { IdRequestModel, CreateEmailInfoModel, DeleteEmailInfoModel, EmailStatsResponseModel, GetAllEmailInfoModel, GetEmailInfoByIdModel, GetEmailInfoModel, GlobalResponse, UpdateEmailInfoModel, SendTicketCreatedEmailModel, SendPasswordResetEmailModel, RequestAccessModel } from '@bosvault/shared-models';

export class EmailService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/administration/email/' + childUrl;
    }

    async getAllEmailInfo(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAllEmailInfoModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllEmailInfo'), reqModel, config);
    }

    async getEmailInfo(reqModel: GetEmailInfoModel, config?: AxiosRequestConfig): Promise<GetEmailInfoByIdModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getEmailInfo'), reqModel, config);
    }

    async createEmailInfo(reqModel: CreateEmailInfoModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createEmailInfo'), reqModel, config);
    }

    async updateEmailInfo(reqModel: UpdateEmailInfoModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateEmailInfo'), reqModel, config);
    }

    async deleteEmailInfo(reqModel: DeleteEmailInfoModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteEmailInfo'), reqModel, config);
    }

    async getEmailStats(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<EmailStatsResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getEmailStats'), reqModel, config);
    }

    async sendTicketCreatedEmail(reqModel: SendTicketCreatedEmailModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('sendTicketCreatedEmail'), reqModel, config);
    }

    async sendPasswordResetEmail(reqModel: SendPasswordResetEmailModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('sendPasswordResetEmail'), reqModel, config);
    }

    async sendAccessRequestEmail(reqModel: RequestAccessModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('sendAccessRequestEmail'), reqModel, config);
    }

    async getAllAccessRequests(config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosGetCall(this.getURLwithMainEndPoint('getAllAccessRequests'), config);
    }
}
