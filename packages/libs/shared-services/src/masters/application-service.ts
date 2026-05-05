import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';
import { CreateLicenseMasterModel, IdRequestModel, UpdateLicenseMasterModel, GlobalResponse } from '@bosvault/shared-models';

export class ApplicationService extends CommonAxiosService {
    private getURL(childUrl: string) {
        return '/license/' + childUrl;
    }

    async getAllApplications(config?: AxiosRequestConfig): Promise<any> {
        const response: any = await this.axiosPostCall(this.getURL('getAllLicenses'), {}, config);
        if (response && response.licenses) {
            response.applications = response.licenses;
        }
        return response;
    }

    async createApplication(reqModel: CreateLicenseMasterModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('createLicense'), reqModel, config);
    }

    async updateApplication(reqModel: UpdateLicenseMasterModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('updateLicense'), reqModel, config);
    }

    async deleteApplication(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('deleteLicense'), reqModel, config);
    }
}
