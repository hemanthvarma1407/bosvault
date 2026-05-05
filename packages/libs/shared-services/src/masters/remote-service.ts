import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { CreateRemoteMasterModel, UpdateRemoteMasterModel, DeleteRemoteMasterModel, GetAllRemoteMasterResponseModel, GlobalResponse, IdRequestModel } from '@bosvault/shared-models';

export class RemoteService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/remote/' + childUrl;
    }

    async getAllRemote(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAllRemoteMasterResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllRemotes'), reqObj, config);
    }

    async createRemote(reqObj: CreateRemoteMasterModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createRemote'), reqObj, config);
    }

    async updateRemote(reqObj: UpdateRemoteMasterModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateRemote'), reqObj, config);
    }

    async deleteRemote(reqObj: DeleteRemoteMasterModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteRemote'), reqObj, config);
    }
}
