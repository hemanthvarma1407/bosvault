import { CommonAxiosService } from '../common-axios-service';
import { AxiosRequestConfig } from 'axios';
import { CreateDepartmentModel, CreateDepartmentResponseModel, DepartmentDropdownResponse, GetAllDepartmentsResponseModel, IdRequestModel, UpdateDepartmentModel, GlobalResponse } from '@bosvault/shared-models';

export class DepartmentService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/department/' + childUrl;
    }

    async createDepartment(reqModel: CreateDepartmentModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createDepartment'), reqModel, config);
    }

    async updateDepartment(reqModel: UpdateDepartmentModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateDepartment'), reqModel, config);
    }

    async getDepartment(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<CreateDepartmentResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getDepartment'), reqModel, config);
    }

    async getAllDepartments(config?: AxiosRequestConfig): Promise<GetAllDepartmentsResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllDepartments'), {}, config);
    }

    async getAllDepartmentsDropdown(config?: AxiosRequestConfig): Promise<DepartmentDropdownResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllDepartmentsDropdown'), {}, config);
    }

    async deleteDepartment(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteDepartment'), reqModel, config);
    }
}
