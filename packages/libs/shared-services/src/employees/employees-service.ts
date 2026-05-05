import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { CreateEmployeeModel, UpdateEmployeeModel, DeleteEmployeeModel, GetEmployeeModel, GetEmployeeResponseModel, GetAllEmployeesResponseModel, GlobalResponse, IdRequestModel, GetAllEmployeesRequestModel } from '@bosvault/shared-models';

export class EmployeesService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/employees/' + childUrl;
    }

    async createEmployee(reqObj: CreateEmployeeModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createEmployee'), reqObj, config);
    }

    async updateEmployee(reqObj: UpdateEmployeeModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateEmployee'), reqObj, config);
    }

    async getEmployee(reqObj: GetEmployeeModel, config?: AxiosRequestConfig): Promise<GetEmployeeResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getEmployee'), reqObj, config);
    }

    async getAllEmployees(reqObj: GetAllEmployeesRequestModel, config?: AxiosRequestConfig): Promise<GetAllEmployeesResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllEmployees'), reqObj, config);
    }

    async deleteEmployee(reqObj: DeleteEmployeeModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteEmployee'), reqObj, config);
    }

    async bulkImport(file: File, companyId: number, userId: number, config?: AxiosRequestConfig): Promise<import('@bosvault/shared-models').BulkImportResponseModel> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('companyId', String(companyId));
        formData.append('userId', String(userId));

        return await this.axiosPostCall(this.getURLwithMainEndPoint('bulk-import'), formData, {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}
