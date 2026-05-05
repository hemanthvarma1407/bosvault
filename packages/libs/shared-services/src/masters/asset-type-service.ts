import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';
import { CreateAssetTypeModel, CreateAssetTypeResponseModel, GetAllAssetTypesResponseModel, IdRequestModel, UpdateAssetTypeModel, AssetTypeDropdownResponse, GlobalResponse } from '@bosvault/shared-models';

export class AssetTypeService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/asset-type/' + childUrl;
    }

    async createAssetType(reqModel: CreateAssetTypeModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createAssetType'), reqModel, config);
    }

    async updateAssetType(reqModel: UpdateAssetTypeModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateAssetType'), reqModel, config);
    }

    async getAssetType(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<CreateAssetTypeResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAssetType'), reqModel, config);
    }

    async getAllAssetTypes(config?: AxiosRequestConfig): Promise<GetAllAssetTypesResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllAssetTypes'), {}, config);
    }

    async getAllAssetTypesDropdown(config?: AxiosRequestConfig): Promise<AssetTypeDropdownResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllAssetTypesDropdown'), {}, config);
    }

    async deleteAssetType(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteAssetType'), reqModel, config);
    }
}
