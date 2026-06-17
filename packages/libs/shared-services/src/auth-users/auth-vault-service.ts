import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { GlobalResponse, RequestVaultOtpModel, ResetVaultPasswordOtpModel } from '@bosvault/shared-models';

export class AuthVaultService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        // Vault endpoints are still served by the auth-users controller
        return '/auth-users/' + childUrl;
    }

    async setVaultPassword(password: string, otp: string, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('set-vault-password'), { password, otp }, config);
    }

    async verifyVaultPassword(password: string, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('verify-vault-password'), { password }, config);
    }

    async requestVaultOtp(reqObj: RequestVaultOtpModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('request-vault-otp'), reqObj, config);
    }

    async resetVaultPasswordWithOtp(reqObj: ResetVaultPasswordOtpModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('reset-vault-password-otp'), reqObj, config);
    }
}
