import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { LicensesService } from './licenses.service';
import { CreateLicenseModel, UpdateLicenseModel, DeleteLicenseModel, GetAllLicensesResponseModel, GetLicenseStatisticsResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { IAuthenticatedRequest } from '../../interfaces/auth.interface';

@ApiTags('Licenses')
@Controller('licenses')
export class LicensesController {
    constructor(private readonly licensesService: LicensesService) { }

    @Post('getAllLicenses')
    @ApiBody({ type: IdRequestModel })
    async getAllLicenses(@Body() reqModel: IdRequestModel): Promise<GetAllLicensesResponseModel> {
        try {
            return await this.licensesService.getAllLicenses(reqModel);
        } catch (error) {
            return returnException(GetAllLicensesResponseModel, error);
        }
    }

    @Post('getLicenseStatistics')
    @ApiBody({ type: IdRequestModel })
    async getLicenseStatistics(@Body() reqModel: IdRequestModel): Promise<GetLicenseStatisticsResponseModel> {
        try {
            return await this.licensesService.getLicenseStatistics(reqModel);
        } catch (error) {
            return returnException(GetLicenseStatisticsResponseModel, error);
        }
    }

    @Post('createLicense')
    @ApiBody({ type: CreateLicenseModel })
    async createLicense(@Body() reqModel: CreateLicenseModel, @Req() req: IAuthenticatedRequest): Promise<GlobalResponse> {
        try {
            const userId = req.user.userId;
            const ipAddress = this.extractIp(req);
            return await this.licensesService.createLicense(reqModel, userId, ipAddress);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateLicense')
    @ApiBody({ type: UpdateLicenseModel })
    async updateLicense(@Body() reqModel: UpdateLicenseModel, @Req() req: IAuthenticatedRequest): Promise<GlobalResponse> {
        try {
            const userId = req.user.userId;
            const ipAddress = this.extractIp(req);
            return await this.licensesService.updateLicense(reqModel, userId, ipAddress);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('deleteLicense')
    @ApiBody({ type: DeleteLicenseModel })
    async deleteLicense(@Body() reqModel: DeleteLicenseModel, @Req() req: IAuthenticatedRequest): Promise<GlobalResponse> {
        try {
            const userId = req.user.userId;
            const ipAddress = this.extractIp(req);
            return await this.licensesService.deleteLicense(reqModel, userId, ipAddress);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getUtilization')
    @ApiBody({ type: IdRequestModel })
    async getUtilization(@Body() reqModel: IdRequestModel): Promise<any> {
        try {
            return await this.licensesService.getUtilization(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getComplianceReport')
    @ApiBody({ type: IdRequestModel })
    async getComplianceReport(@Body() reqModel: IdRequestModel): Promise<any> {
        try {
            return await this.licensesService.getComplianceReport(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getCostOptimization')
    @ApiBody({ type: IdRequestModel })
    async getCostOptimization(@Body() reqModel: IdRequestModel): Promise<any> {
        try {
            return await this.licensesService.getCostOptimization(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    private extractIp(req: any): string {
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            return Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor.split(',')[0].trim();
        }
        return req.ip || req.connection?.remoteAddress || 'unknown';
    }
}
