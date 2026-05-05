import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';
import { CreateLicenseMasterModel, CreateLicenseMasterResponseModel, GetAllLicenseMastersResponseModel, IdRequestModel, UpdateLicenseMasterModel, UpdateLicenseMasterResponseModel, GlobalResponse } from '@bosvault/shared-models';

export class LicenseMasterService extends CommonAxiosService {
    private getURL(childUrl: string) {
        return '/license/' + childUrl;
    }

    async getAllLicenses(config?: AxiosRequestConfig): Promise<GetAllLicenseMastersResponseModel> {
        return await this.axiosPostCall(this.getURL('getAllLicenses'), {}, config);
    }

    async createLicense(reqModel: CreateLicenseMasterModel, config?: AxiosRequestConfig): Promise<CreateLicenseMasterResponseModel> {
        return await this.axiosPostCall(this.getURL('createLicense'), reqModel, config);
    }

    async updateLicense(reqModel: UpdateLicenseMasterModel, config?: AxiosRequestConfig): Promise<UpdateLicenseMasterResponseModel> {
        return await this.axiosPostCall(this.getURL('updateLicense'), reqModel, config);
    }

    async deleteLicense(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('deleteLicense'), reqModel, config);
    }
}
