import { CommonAxiosService } from '../common-axios-service';
import { CreatePOModel, UpdatePOModel, GetAllPOsModel, GetPOByIdModel, GlobalResponse, GetPORequestModel, UpdatePOStatusRequestModel, GetAllPOsCompanyIdRequestModel } from '@bosvault/shared-models';
import { AxiosRequestConfig } from 'axios';

export class ProcurementService extends CommonAxiosService {
    private getURL(childUrl: string) {
        return '/procurement/' + childUrl;
    }

    async createPurchaseOrder(model: CreatePOModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('createPurchaseOrder'), model, config);
    }

    async updatePurchaseOrder(model: UpdatePOModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('updatePurchaseOrder'), model, config);
    }

    async getAllPurchaseOrders(config?: AxiosRequestConfig): Promise<GetAllPOsModel> {
        return await this.axiosPostCall(this.getURL('getAllPurchaseOrders'), {}, config);
    }

    async getPurchaseOrderByCompanyId(reqModel: GetAllPOsCompanyIdRequestModel, config?: AxiosRequestConfig): Promise<GetAllPOsModel> {
        return await this.axiosPostCall(this.getURL('getPurchaseOrderByCompanyId'), reqModel, config);
    }

    async getPurchaseOrderById(reqModel: GetPORequestModel, config?: AxiosRequestConfig): Promise<GetPOByIdModel> {
        return await this.axiosPostCall(this.getURL('getPurchaseOrderById'), reqModel, config);
    }

    async updatePOStatus(reqModel: UpdatePOStatusRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('updatePOStatus'), reqModel, config);
    }

    async deletePurchaseOrder(id: number, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURL('deletePurchaseOrder'), { id }, config);
    }
}
