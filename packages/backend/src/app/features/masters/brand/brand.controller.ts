import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { DeviceConfigService } from './brand.service';
import { CreateDeviceConfigModel, UpdateDeviceConfigModel, GetAllDeviceConfigsResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Device Configuration Master')
@Controller('device-configs')
@UseGuards(JwtAuthGuard)
export class DeviceConfigController {
    constructor(private deviceConfigService: DeviceConfigService) { }

    @Post('getAllDeviceConfigs')
    async getAllDeviceConfigs(): Promise<GetAllDeviceConfigsResponseModel> {
        try {
            return await this.deviceConfigService.getAllDeviceConfigs();
        } catch (error) {
            return returnException(GetAllDeviceConfigsResponseModel, error);
        }
    }

    @Post('createDeviceConfig')
    @ApiBody({ type: CreateDeviceConfigModel })
    async createDeviceConfig(@Body() reqModel: CreateDeviceConfigModel, @Req() req: any): Promise<GlobalResponse> {
        reqModel.userId = req.user.userId;
        try {
            return await this.deviceConfigService.createDeviceConfig(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateDeviceConfig')
    @ApiBody({ type: UpdateDeviceConfigModel })
    async updateDeviceConfig(@Body() reqModel: UpdateDeviceConfigModel): Promise<GlobalResponse> {
        try {
            return await this.deviceConfigService.updateDeviceConfig(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('deleteDeviceConfig')
    @ApiBody({ type: IdRequestModel })
    async deleteDeviceConfig(@Body() reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.deviceConfigService.deleteDeviceConfig(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }
}
