import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { CreateLicenseModel, UpdateLicenseModel, GetAllLicensesResponseModel, GlobalResponse, IdRequestModel } from '@bosvault/shared-models';

export class LicensesService extends CommonAxiosService {
    private baseUrl = '/licenses';

    async getAllLicenses(req: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAllLicensesResponseModel> {
        return this.axiosPostCall(`${this.baseUrl}/getAllLicenses`, req, config);
    }

    async createLicense(model: CreateLicenseModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return this.axiosPostCall(`${this.baseUrl}/createLicense`, model, config);
    }

    async updateLicense(model: UpdateLicenseModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return this.axiosPostCall(`${this.baseUrl}/updateLicense`, model, config);
    }

    async deleteLicense(model: { id: number }, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return this.axiosPostCall(`${this.baseUrl}/deleteLicense`, model, config);
    }

    async getUtilization(req: IdRequestModel, config?: AxiosRequestConfig): Promise<any> {
        return this.axiosPostCall(`${this.baseUrl}/getUtilization`, req, config);
    }

    async getComplianceReport(req: IdRequestModel, config?: AxiosRequestConfig): Promise<any> {
        return this.axiosPostCall(`${this.baseUrl}/getComplianceReport`, req, config);
    }

    async getCostOptimization(req: IdRequestModel, config?: AxiosRequestConfig): Promise<any> {
        return this.axiosPostCall(`${this.baseUrl}/getCostOptimization`, req, config);
    }
}
