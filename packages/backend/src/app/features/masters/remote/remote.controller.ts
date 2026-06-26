import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RemoteService } from './remote.service';
import { CreateRemoteMasterModel, UpdateRemoteMasterModel, GetAllRemoteMasterResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Remote Master')
@Controller('remote')
@UseGuards(JwtAuthGuard)
export class RemoteController {
    constructor(private remoteService: RemoteService) { }

    @Post('createRemote')
    @ApiBody({ type: CreateRemoteMasterModel })
    async createRemote(@Body() reqModel: CreateRemoteMasterModel): Promise<GlobalResponse> {
        try {
            return await this.remoteService.createRemote(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateRemote')
    @ApiBody({ type: UpdateRemoteMasterModel })
    async updateRemote(@Body() reqModel: UpdateRemoteMasterModel): Promise<GlobalResponse> {
        try {
            return await this.remoteService.updateRemote(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getRemote')
    @ApiBody({ type: IdRequestModel })
    async getRemote(@Body() reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.remoteService.getRemote(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getAllRemotes')
    async getAllRemotes(@Body() reqModel: IdRequestModel): Promise<GetAllRemoteMasterResponseModel> {
        try {
            return await this.remoteService.getAllRemotes(reqModel.id);
        } catch (error) {
            return returnException(GetAllRemoteMasterResponseModel, error);
        }
    }

    @Post('deleteRemote')
    @ApiBody({ type: IdRequestModel })
    async deleteRemote(@Body() reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.remoteService.deleteRemote(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }
}
