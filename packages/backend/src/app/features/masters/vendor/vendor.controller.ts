import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorModel, UpdateVendorModel, GetAllVendorsResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Vendors Master')
@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorController {
    constructor(private vendorService: VendorService) { }

    @Post('getAllVendors')
    async getAllVendors(): Promise<GetAllVendorsResponseModel> {
        try {
            return await this.vendorService.getAllVendors();
        } catch (error) {
            return returnException(GetAllVendorsResponseModel, error);
        }
    }

    @Post('createVendor')
    @ApiBody({ type: CreateVendorModel })
    async createVendor(@Body() createVendorModel: CreateVendorModel, @Req() req: any): Promise<GlobalResponse> {
        createVendorModel.userId = req.user.userId;
        try {
            return await this.vendorService.createVendor(createVendorModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateVendor')
    @ApiBody({ type: UpdateVendorModel })
    async updateVendor(@Body() updateVendorModel: UpdateVendorModel): Promise<GlobalResponse> {
        try {
            return await this.vendorService.updateVendor(updateVendorModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('deleteVendor')
    @ApiBody({ type: IdRequestModel })
    async deleteVendor(@Body() idRequestModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.vendorService.deleteVendor(idRequestModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }
}
