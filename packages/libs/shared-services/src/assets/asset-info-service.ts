import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { CreateAssetModel, UpdateAssetModel, DeleteAssetModel, GetAssetModel, GetAssetByIdModel, GetAllAssetsModel, GlobalResponse, AssetStatisticsResponseModel, AssetSearchRequestModel, GetAssetsWithAssignmentsResponseModel, GetStoreAssetsRequestModel, GetStoreAssetsResponseModel, GetReturnAssetsRequestModel, GetReturnAssetsResponseModel, ProcessReturnRequestModel, ProcessReturnResponseModel, GetNextAssignmentsRequestModel, GetNextAssignmentsResponseModel, CreateNextAssignmentRequestModel, CreateNextAssignmentResponseModel, AssignFromQueueRequestModel, AssignFromQueueResponseModel, BulkImportResponseModel, AssetTimelineResponseModel, CreateAssetAssignModel, UpdateAssetAssignModel, GetAssetAssignModel, GetAllAssetAssignsModel, GetAssetAssignByIdModel, IdRequestModel, AssetTimelineRequestModel, AssignAssetOpRequestModel, ReturnAssetOpRequestModel } from '@bosvault/shared-models';

export class AssetInfoService extends CommonAxiosService {
    private readonly BASE_PATH = '/asset-info';

    async getTimeline(reqObj: AssetTimelineRequestModel, config?: AxiosRequestConfig): Promise<AssetTimelineResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/timeline`, reqObj, config);
    }

    async bulkImport(file: File, companyId: number, userId: number, config?: AxiosRequestConfig): Promise<BulkImportResponseModel> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('companyId', String(companyId));
        formData.append('userId', String(userId));
        return await this.axiosPostCall(`${this.BASE_PATH}/bulk-import`, formData, {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    async createAsset(reqObj: CreateAssetModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(`${this.BASE_PATH}/createAsset`, reqObj, config);
    }

    async updateAsset(reqObj: UpdateAssetModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(`${this.BASE_PATH}/updateAsset`, reqObj, config);
    }

    async getAsset(reqObj: GetAssetModel, config?: AxiosRequestConfig): Promise<GetAssetByIdModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/getAsset`, reqObj, config);
    }

    async getAllAssets(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAllAssetsModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/getAllAssets`, reqObj, config);
    }

    async deleteAsset(reqObj: DeleteAssetModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(`${this.BASE_PATH}/deleteAsset`, reqObj, config);
    }

    async getAssetStatistics(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<AssetStatisticsResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/statistics`, reqObj, config);
    }

    async searchAssets(reqObj: AssetSearchRequestModel, config?: AxiosRequestConfig): Promise<GetAllAssetsModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/search`, reqObj, config);
    }

    async getAssetsWithAssignments(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAssetsWithAssignmentsResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/with-assignments`, reqObj, config);
    }

    async getStoreAssets(reqObj: GetStoreAssetsRequestModel, config?: AxiosRequestConfig): Promise<GetStoreAssetsResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/store-assets`, reqObj, config);
    }

    async getReturnAssets(reqObj: GetReturnAssetsRequestModel, config?: AxiosRequestConfig): Promise<GetReturnAssetsResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/return-assets`, reqObj, config);
    }

    async processReturn(reqObj: ProcessReturnRequestModel, config?: AxiosRequestConfig): Promise<ProcessReturnResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/process-return`, reqObj, config);
    }

    async getNextAssignments(reqObj: GetNextAssignmentsRequestModel, config?: AxiosRequestConfig): Promise<GetNextAssignmentsResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/next-assignments`, reqObj, config);
    }

    async createNextAssignment(reqObj: CreateNextAssignmentRequestModel, config?: AxiosRequestConfig): Promise<CreateNextAssignmentResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/create-next-assignment`, reqObj, config);
    }

    async assignFromQueue(reqObj: AssignFromQueueRequestModel, config?: AxiosRequestConfig): Promise<AssignFromQueueResponseModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/assign-from-queue`, reqObj, config);
    }

    async createAssignment(reqObj: CreateAssetAssignModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(`${this.BASE_PATH}/createAssignment`, reqObj, config);
    }

    async updateAssignment(reqObj: UpdateAssetAssignModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(`${this.BASE_PATH}/updateAssignment`, reqObj, config);
    }

    async getAssignment(reqObj: GetAssetAssignModel, config?: AxiosRequestConfig): Promise<GetAssetAssignByIdModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/getAssignment`, reqObj, config);
    }

    async getAllAssignments(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAllAssetAssignsModel> {
        return await this.axiosPostCall(`${this.BASE_PATH}/getAllAssignments`, reqObj, config);
    }

    async assignAssetOp(reqObj: AssignAssetOpRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(`${this.BASE_PATH}/assignAssetOp`, reqObj, config);
    }

    async returnAssetOp(reqObj: ReturnAssetOpRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(`${this.BASE_PATH}/returnAssetOp`, reqObj, config);
    }
}
