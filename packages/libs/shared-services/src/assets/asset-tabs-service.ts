import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { GetStoreAssetsRequestModel, GetStoreAssetsResponseModel, GetReturnAssetsRequestModel, GetReturnAssetsResponseModel, ProcessReturnRequestModel, ProcessReturnResponseModel, GetNextAssignmentsRequestModel, GetNextAssignmentsResponseModel, CreateNextAssignmentRequestModel, CreateNextAssignmentResponseModel, AssignFromQueueRequestModel, AssignFromQueueResponseModel } from '@bosvault/shared-models';

export class AssetTabsService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/asset-info/' + childUrl;
    }

    async getStoreAssets(reqObj: GetStoreAssetsRequestModel, config?: AxiosRequestConfig): Promise<GetStoreAssetsResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('store-assets'), reqObj, config);
    }

    async getReturnAssets(reqObj: GetReturnAssetsRequestModel, config?: AxiosRequestConfig): Promise<GetReturnAssetsResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('return-assets'), reqObj, config);
    }

    async processReturn(reqObj: ProcessReturnRequestModel, config?: AxiosRequestConfig): Promise<ProcessReturnResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('process-return'), reqObj, config);
    }

    async getNextAssignments(reqObj: GetNextAssignmentsRequestModel, config?: AxiosRequestConfig): Promise<GetNextAssignmentsResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('next-assignments'), reqObj, config);
    }

    async createNextAssignment(reqObj: CreateNextAssignmentRequestModel, config?: AxiosRequestConfig): Promise<CreateNextAssignmentResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('create-next-assignment'), reqObj, config);
    }

    async assignFromQueue(reqObj: AssignFromQueueRequestModel, config?: AxiosRequestConfig): Promise<AssignFromQueueResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('assign-from-queue'), reqObj, config);
    }
}
