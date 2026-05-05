import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { DashboardStatsResponseModel, IdRequestModel } from '@bosvault/shared-models';

export class DashboardService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/dashboard/' + childUrl;
    }

    async getDashboardStats(reqModel: IdRequestModel, config?: AxiosRequestConfig): Promise<DashboardStatsResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getDashboardStats'), reqModel, config);
    }
}
