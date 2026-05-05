import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LicenseService } from './license.service';
import { CreateLicenseMasterModel, UpdateLicenseMasterModel, GetAllLicenseMastersResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Licenses Master')
@Controller('license')
@UseGuards(JwtAuthGuard)
export class LicenseController {
    constructor(private licenseService: LicenseService) { }

    @Post('createLicense')
    @ApiBody({ type: CreateLicenseMasterModel })
    async createLicense(@Body() createLicenseModel: CreateLicenseMasterModel): Promise<GlobalResponse> {
        try {
            return await this.licenseService.createLicense(createLicenseModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateLicense')
    @ApiBody({ type: UpdateLicenseMasterModel })
    async updateLicense(@Body() updateLicenseModel: UpdateLicenseMasterModel): Promise<GlobalResponse> {
        try {
            return await this.licenseService.updateLicense(updateLicenseModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getLicense')
    @ApiBody({ type: IdRequestModel })
    async getLicense(@Body() idRequestModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.licenseService.getLicense(idRequestModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getAllLicenses')
    async getAllLicenses(): Promise<GetAllLicenseMastersResponseModel> {
        try {
            return await this.licenseService.getAllLicenses();
        } catch (error) {
            return returnException(GetAllLicenseMastersResponseModel, error);
        }
    }

    @Post('deleteLicense')
    @ApiBody({ type: IdRequestModel })
    async deleteLicense(@Body() idRequestModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.licenseService.deleteLicense(idRequestModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }
}
