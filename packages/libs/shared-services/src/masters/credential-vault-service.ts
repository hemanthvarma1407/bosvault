import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { CreateCredentialVaultModel, UpdateCredentialVaultModel, DeleteCredentialVaultModel, GetAllCredentialVaultResponseModel, GlobalResponse, IdRequestModel } from '@bosvault/shared-models';

export class CredentialVaultService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/credential-vault/' + childUrl;
    }

    async getAllCredentialVaults(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAllCredentialVaultResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllCredentialVaults'), reqObj, config);
    }

    async createCredentialVault(reqObj: CreateCredentialVaultModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createCredentialVault'), reqObj, config);
    }

    async updateCredentialVault(reqObj: UpdateCredentialVaultModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateCredentialVault'), reqObj, config);
    }

    async deleteCredentialVault(reqObj: DeleteCredentialVaultModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteCredentialVault'), reqObj, config);
    }

    async list(): Promise<any> {
        return this.axiosGetCall(this.getURLwithMainEndPoint('list'));
    }

    async reveal(id: number): Promise<any> {
        return this.axiosGetCall(this.getURLwithMainEndPoint(`reveal/${id}`));
    }
}
