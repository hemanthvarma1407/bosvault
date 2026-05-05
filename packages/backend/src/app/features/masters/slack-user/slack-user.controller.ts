import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SlackUserService } from './slack-user.service';
import { CreateSlackUserModel, UpdateSlackUserModel, GetAllSlackUsersResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Slack Users Master')
@Controller('slack-users')
@UseGuards(JwtAuthGuard)
export class SlackUserController {
    constructor(private slackUserService: SlackUserService) { }

    @Post('getAllSlackUsers')
    async getAllSlackUsers(): Promise<GetAllSlackUsersResponseModel> {
        try {
            return await this.slackUserService.getAllSlackUsers();
        } catch (error) {
            return returnException(GetAllSlackUsersResponseModel, error);
        }
    }

    @Post('importSlackUsers')
    async importSlackUsers(@Body() body: { companyId?: number }, @Req() req: any): Promise<GlobalResponse> {
        try {
            const companyId = body.companyId || req.user?.companyId;
            return await this.slackUserService.importSlackUsers(companyId);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('createSlackUser')
    @ApiBody({ type: CreateSlackUserModel })
    async createSlackUser(@Body() reqModel: CreateSlackUserModel, @Req() req: any): Promise<GlobalResponse> {
        reqModel.userId = req.user.userId;
        try {
            return await this.slackUserService.createSlackUser(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateSlackUser')
    @ApiBody({ type: UpdateSlackUserModel })
    async updateSlackUser(@Body() reqModel: UpdateSlackUserModel): Promise<GlobalResponse> {
        try {
            return await this.slackUserService.updateSlackUser(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('deleteSlackUser')
    @ApiBody({ type: IdRequestModel })
    async deleteSlackUser(@Body() reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.slackUserService.deleteSlackUser(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }
}
