import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';
import { CreateDeviceConfigModel, CreateDeviceConfigResponseModel, GetAllDeviceConfigsResponseModel, IdRequestModel, UpdateDeviceConfigModel, UpdateDeviceConfigResponseModel, GlobalResponse } from '@bosvault/shared-models';

export class DeviceConfigService extends CommonAxiosService {
    private getURL(childUrl: string) {
        return '/device-configs/' + childUrl;
    }

    async getAllDeviceConfigs(config?: AxiosRequestConfig): Promise<GetAllDeviceConfigsResponseModel> {
        return await this.axiosPostCall(this.getURL('getAllDeviceConfigs'), {}, config);
    }

    async createDeviceConfig(reqModel: CreateDeviceConfigModel, config?: AxiosRequestConfig): Promise<CreateDeviceConfigResponseModel> {
        return await this.axiosPostCall(this.getURL('createDeviceConfig'), reqModel, config);
    }

    async updateDeviceConfig(reqModel: UpdateDeviceConfigModel, config?: AxiosRequestConfig): Promise<UpdateDeviceConfigResponseModel> {
        return await this.axiosPostCall(this.getURL('updateDeviceConfig'), reqModel, config);
    }

    async deleteDeviceConfig(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('deleteDeviceConfig'), reqModel, config);
    }
}
