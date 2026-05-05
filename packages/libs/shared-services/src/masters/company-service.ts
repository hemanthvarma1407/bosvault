import { CreateCompanyModel, UpdateCompanyModel, DeleteCompanyModel, GetCompanyModel, GlobalResponse, CompanyResponse, CompanyDropdownResponse } from '@bosvault/shared-models';
import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';

export class CompanyService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/company-info/' + childUrl;
    }

    async createCompany(reqModel: CreateCompanyModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createCompany'), reqModel, config);
    }

    async updateCompany(reqModel: UpdateCompanyModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateCompany'), reqModel, config);
    }

    async getCompany(reqModel: GetCompanyModel, config?: AxiosRequestConfig): Promise<CompanyResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getCompany'), reqModel, config);
    }

    async getAllCompanies(config?: AxiosRequestConfig): Promise<CompanyResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllCompanies'), {}, config);
    }

    async getAllCompaniesDropdown(config?: AxiosRequestConfig): Promise<CompanyDropdownResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllCompaniesDropdown'), {}, config);
    }

    async deleteCompany(reqModel: DeleteCompanyModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteCompany'), reqModel, config);
    }
}
