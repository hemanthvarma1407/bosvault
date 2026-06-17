import { Body, Controller, Post, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthUsersService } from './auth-users.service';
import { AuthVaultService } from './auth-vault.service';
import { DeleteUserModel, GetAllUsersModel, LoginResponseModel, LoginUserModel, LogoutUserModel, RegisterUserModel, UpdateUserModel, RequestAccessModel, ForgotPasswordModel, ResetPasswordModel, RefreshTokenModel, IdRequestModel, AccessRequestsListModel, GlobalResponse, RequestVaultOtpModel, ResetVaultPasswordOtpModel } from '@bosvault/shared-models';
import { Request, Response } from 'express';
import { Public } from '../../decorators/public.decorator';
import { returnException } from '@bosvault/backend-utils';

@ApiTags('Auth Users')
@Controller('auth-users')
export class AuthUsersController {
    constructor(
        private service: AuthUsersService,
        private vaultService: AuthVaultService
    ) { }

    @Post('registerUser')
    @Public()
    @ApiBody({ type: RegisterUserModel })
    async registerUser(@Body() reqModel: RegisterUserModel): Promise<GlobalResponse> {
        try {
            return await this.service.registerUser(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('loginUser')
    @Public()
    @ApiBody({ type: LoginUserModel })
    async loginUser(@Body() reqModel: LoginUserModel): Promise<LoginResponseModel> {
        try {
            return await this.service.loginUser(reqModel);
        } catch (error) {
            return returnException(LoginResponseModel, error);
        }
    }

    @Post('refresh-token')
    @Public()
    @ApiOperation({ summary: 'Refresh access token' })
    async refreshToken(@Body() reqModel: RefreshTokenModel): Promise<LoginResponseModel> {
        try {
            return await this.service.refreshToken(reqModel);
        } catch (error) {
            return returnException(LoginResponseModel, error);
        }
    }

    @Post('logOutUser')
    @ApiBody({ type: LogoutUserModel })
    async logOutUser(@Body() reqModel: LogoutUserModel): Promise<GlobalResponse> {
        try {
            return await this.service.logOutUser(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateUser')
    @ApiBody({ type: UpdateUserModel })
    async updateUser(@Body() reqModel: UpdateUserModel): Promise<GlobalResponse> {
        try {
            return await this.service.updateUser(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('deleteUser')
    @ApiBody({ type: DeleteUserModel })
    async deleteUser(@Body() reqModel: DeleteUserModel): Promise<GlobalResponse> {
        try {
            return await this.service.deleteUser(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getAllUsers')
    @ApiBody({ type: IdRequestModel })
    async getAllUsers(@Body() reqModel: IdRequestModel): Promise<GetAllUsersModel> {
        try {
            return await this.service.getAllUsers(reqModel);
        } catch (error) {
            return returnException(GetAllUsersModel, error);
        }
    }

    @Post('requestAccess')
    @Public()
    @ApiBody({ type: RequestAccessModel })
    async requestAccess(@Body() reqModel: RequestAccessModel): Promise<GlobalResponse> {
        try {
            return await this.service.requestAccess(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('forgot-password')
    @Public()
    @ApiBody({ type: ForgotPasswordModel })
    async forgotPassword(@Body() reqModel: ForgotPasswordModel): Promise<GlobalResponse> {
        try {
            return await this.service.forgotPassword(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('reset-password')
    @Public()
    @ApiBody({ type: ResetPasswordModel })
    async resetPassword(@Body() reqModel: ResetPasswordModel): Promise<GlobalResponse> {
        try {
            return await this.service.resetPassword(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }


    @UseGuards(JwtAuthGuard)
    @Get('getAccessRequests')
    async getAccessRequests(): Promise<AccessRequestsListModel> {
        try {
            return await this.service.getAccessRequests();
        } catch (error) {
            return returnException(AccessRequestsListModel, error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('closeAccessRequest')
    async closeAccessRequest(@Body() body: { id: number }): Promise<GlobalResponse> {
        try {
            return await this.service.closeAccessRequest(Number(body.id));
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('deleteAccessRequest')
    async deleteAccessRequest(@Body() body: { id: number }): Promise<GlobalResponse> {
        try {
            return await this.service.deleteAccessRequest(Number(body.id));
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-password')
    async verifyPassword(@Req() req: any, @Body() body: { password: string }): Promise<GlobalResponse> {
        try {
            const isValid = await this.service.verifyPassword(req.user.userId, body.password);
            if (isValid) {
                return new GlobalResponse(true, 0, "Password verified");
            } else {
                return new GlobalResponse(false, 1, "Invalid password");
            }
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('set-vault-password')
    async setVaultPassword(@Req() req: any, @Body() body: { password: string; otp: string }): Promise<GlobalResponse> {
        try {
            await this.vaultService.setVaultPassword(req.user.userId, body.password, body.otp);
            return new GlobalResponse(true, 0, "Vault password set successfully");
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-vault-password')
    async verifyVaultPassword(@Req() req: any, @Body() body: { password: string }): Promise<GlobalResponse> {
        try {
            const user = await this.service.getUserById(req.user.userId);
            if (!user.vaultPasswordHash) {
                return new GlobalResponse(false, 2, "Vault password not set");
            }
            const isValid = await this.vaultService.verifyVaultPassword(req.user.userId, body.password);
            if (isValid) {
                return new GlobalResponse(true, 0, "Vault password verified");
            } else {
                return new GlobalResponse(false, 1, "Invalid vault password");
            }
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('request-vault-otp')
    @ApiBody({ type: RequestVaultOtpModel })
    async requestVaultOtp(@Req() req: any, @Body() reqModel: RequestVaultOtpModel): Promise<GlobalResponse> {
        try {
            return await this.vaultService.requestVaultReset(reqModel.email);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('reset-vault-password-otp')
    @ApiBody({ type: ResetVaultPasswordOtpModel })
    async resetVaultPasswordOtp(@Req() req: any, @Body() reqModel: ResetVaultPasswordOtpModel): Promise<GlobalResponse> {
        try {
            return await this.vaultService.resetVaultPasswordWithOtp(reqModel.email, reqModel.otp, reqModel.newPassword);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('getMe')
    async getMe(@Req() req: any): Promise<LoginResponseModel> {
        try {
            return await this.service.getMe(req.user.userId);
        } catch (error) {
            return returnException(LoginResponseModel, error);
        }
    }

    @Get('google')
    @Public()
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req: Request) {
    }

    @Get('google/callback')
    @Public()
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        try {
            const googleProfile = req.user;
            const user = await this.service.validateGoogleUser(googleProfile);
            const response = await this.service.loginUserFromOAuth(user);
            const frontendUrl = process.env.FRONTEND_URL;
            res.redirect(`${frontendUrl}/auth/callback?accessToken=${response.accessToken}&refreshToken=${response.refreshToken}`);
        } catch (error) {
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
    }
}
