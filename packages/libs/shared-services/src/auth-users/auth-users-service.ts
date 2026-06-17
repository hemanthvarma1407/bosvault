import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { DeleteUserModel, GetAllUsersModel, GlobalResponse, LoginResponseModel, LoginUserModel, LogoutUserModel, RegisterUserModel, RequestAccessModel, UpdateUserModel, ForgotPasswordModel, ResetPasswordModel, IdRequestModel, AccessRequestsListModel } from '@bosvault/shared-models';

export class AuthUsersService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/auth-users/' + childUrl;
    }

    async registerUser(reqObj: RegisterUserModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('registerUser'), reqObj, config);
    }

    async loginUser(reqObj: LoginUserModel, config?: AxiosRequestConfig): Promise<LoginResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('loginUser'), reqObj, config);
    }

    async logOutUser(reqObj: LogoutUserModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('logOutUser'), reqObj, config);
    }

    async updateUser(reqObj: UpdateUserModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateUser'), reqObj, config);
    }

    async deleteUser(reqObj: DeleteUserModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteUser'), reqObj, config);
    }

    async getAllUsers(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAllUsersModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllUsers'), reqObj, config);
    }

    async requestAccess(reqObj: RequestAccessModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('requestAccess'), reqObj, config);
    }

    async forgotPassword(reqObj: ForgotPasswordModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('forgot-password'), reqObj, config);
    }

    async resetPassword(reqObj: ResetPasswordModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('reset-password'), reqObj, config);
    }

    async verifyPassword(password: string, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('verify-password'), { password }, config);
    }


    async getMe(config?: AxiosRequestConfig): Promise<LoginResponseModel> {
        return await this.axiosGetCall(this.getURLwithMainEndPoint('getMe'), config);
    }

    async getAccessRequests(config?: AxiosRequestConfig): Promise<AccessRequestsListModel> {
        return await this.axiosGetCall(this.getURLwithMainEndPoint('getAccessRequests'), config);
    }

    async closeAccessRequest(id: number, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('closeAccessRequest'), { id }, config);
    }

    async deleteAccessRequest(id: number, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteAccessRequest'), { id }, config);
    }

    getGoogleAuthUrl() {
        return this.URL + this.getURLwithMainEndPoint('google');
    }
}
