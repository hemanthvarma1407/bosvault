import { CommonAxiosService } from "../common-axios-service";
import { CreateContractModel, UpdateContractModel, GlobalResponse, IdRequestModel } from '@bosvault/shared-models';

export class ContractsService extends CommonAxiosService {
    private baseUrl = '/contract';

    async getAllContracts(): Promise<GlobalResponse> {
        return this.axiosGetCall(`${this.baseUrl}/getAllContracts`);
    }

    async getExpiringContracts(days = 30): Promise<GlobalResponse> {
        return this.axiosGetCall(`${this.baseUrl}/getExpiringContracts?days=${days}`);
    }

    async createContract(model: CreateContractModel): Promise<GlobalResponse> {
        return this.axiosPostCall(`${this.baseUrl}/createContract`, model);
    }

    async updateContract(model: UpdateContractModel): Promise<GlobalResponse> {
        return this.axiosPostCall(`${this.baseUrl}/updateContract`, model);
    }

    async deleteContract(model: IdRequestModel): Promise<GlobalResponse> {
        return this.axiosPostCall(`${this.baseUrl}/deleteContract`, model);
    }
}
