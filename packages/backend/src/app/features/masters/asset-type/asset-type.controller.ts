import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AssetTypeService } from './asset-type.service';
import { CreateAssetTypeModel, UpdateAssetTypeModel, GetAllAssetTypesResponseModel, CreateAssetTypeResponseModel, AssetTypeDropdownResponse, IdRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Asset Types Master')
@Controller('asset-type')
@UseGuards(JwtAuthGuard)
export class AssetTypeController {
    constructor(private service: AssetTypeService) { }

    @Post('createAssetType')
    @ApiBody({ type: CreateAssetTypeModel })
    async createAssetType(@Body() createAssetTypeModel: CreateAssetTypeModel, @Req() req: any): Promise<GlobalResponse> {
        createAssetTypeModel.userId = req.user.userId;
        try {
            return await this.service.createAssetType(createAssetTypeModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateAssetType')
    @ApiBody({ type: UpdateAssetTypeModel })
    async updateAssetType(@Body() updateAssetTypeModel: UpdateAssetTypeModel): Promise<GlobalResponse> {
        try {
            return await this.service.updateAssetType(updateAssetTypeModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getAssetType')
    @ApiBody({ type: IdRequestModel })
    async getAssetType(@Body() idRequestModel: IdRequestModel): Promise<CreateAssetTypeResponseModel> {
        try {
            return await this.service.getAssetType(idRequestModel);
        } catch (error) {
            return returnException(CreateAssetTypeResponseModel, error);
        }
    }

    @Post('getAllAssetTypes')
    async getAllAssetTypes(): Promise<GetAllAssetTypesResponseModel> {
        try {
            return await this.service.getAllAssetTypes();
        } catch (error) {
            return returnException(GetAllAssetTypesResponseModel, error);
        }
    }

    @Post('getAllAssetTypesDropdown')
    async getAllAssetTypesDropdown(): Promise<AssetTypeDropdownResponse> {
        try {
            return await this.service.getAllAssetTypesDropdown();
        } catch (error) {
            return returnException(AssetTypeDropdownResponse, error);
        }
    }

    @Post('deleteAssetType')
    @ApiBody({ type: IdRequestModel })
    async deleteAssetType(@Body() reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.deleteAssetType(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }
}
