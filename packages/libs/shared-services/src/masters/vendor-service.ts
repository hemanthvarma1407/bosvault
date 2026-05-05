import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';
import { CreateVendorModel, GetAllVendorsResponseModel, IdRequestModel, UpdateVendorModel, GlobalResponse } from '@bosvault/shared-models';

export class VendorService extends CommonAxiosService {
    private getURL(childUrl: string) {
        return '/vendors/' + childUrl;
    }

    async getAllVendors(config?: AxiosRequestConfig): Promise<GetAllVendorsResponseModel> {
        return await this.axiosPostCall(this.getURL('getAllVendors'), {}, config);
    }

    async createVendor(reqModel: CreateVendorModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('createVendor'), reqModel, config);
    }

    async updateVendor(reqModel: UpdateVendorModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('updateVendor'), reqModel, config);
    }

    async deleteVendor(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('deleteVendor'), reqObj, config);
    }
}
