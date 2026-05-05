import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { EmailInfoService } from './email-info.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { CreateEmailInfoModel, UpdateEmailInfoModel, DeleteEmailInfoModel, GetAllEmailInfoModel, EmailStatsResponseModel, IdRequestModel, GetEmailInfoModel, GetEmailInfoByIdModel, SendTicketCreatedEmailModel, SendPasswordResetEmailModel, RequestAccessModel, GlobalResponse } from '@bosvault/shared-models';
import { returnException } from '@bosvault/backend-utils';

@ApiTags('Email Settings')
@Controller('administration/email')
@UseGuards(JwtAuthGuard)
export class EmailController {
    constructor(private readonly emailService: EmailInfoService) { }

    @Post('getAllEmailInfo')
    @ApiBody({ type: IdRequestModel })
    async getAllEmailInfo(@Body() req: IdRequestModel): Promise<GetAllEmailInfoModel> {
        try {
            return await this.emailService.getAllEmailInfo(req);
        } catch (error) {
            return returnException(GetAllEmailInfoModel, error);
        }
    }

    @Post('getEmailInfo')
    @ApiBody({ type: GetEmailInfoModel })
    async getEmailInfo(@Body() req: GetEmailInfoModel): Promise<GetEmailInfoByIdModel> {
        try {
            return await this.emailService.getEmailInfo(req);
        } catch (error) {
            return returnException(GetEmailInfoByIdModel, error);
        }
    }

    @Post('createEmailInfo')
    @ApiBody({ type: CreateEmailInfoModel })
    async createEmailInfo(@Body() req: CreateEmailInfoModel): Promise<GlobalResponse> {
        try {
            return await this.emailService.createEmailInfo(req);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateEmailInfo')
    @ApiBody({ type: UpdateEmailInfoModel })
    async updateEmailInfo(@Body() req: UpdateEmailInfoModel): Promise<GlobalResponse> {
        try {
            return await this.emailService.updateEmailInfo(req);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('deleteEmailInfo')
    @ApiBody({ type: DeleteEmailInfoModel })
    async deleteEmailInfo(@Body() req: DeleteEmailInfoModel): Promise<GlobalResponse> {
        try {
            return await this.emailService.deleteEmailInfo(req);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getEmailStats')
    @ApiBody({ type: IdRequestModel })
    async getEmailStats(@Body() req: IdRequestModel): Promise<EmailStatsResponseModel> {
        try {
            return await this.emailService.getEmailStats(req);
        } catch (error) {
            return returnException(EmailStatsResponseModel, error);
        }
    }

    @Post('sendTicketCreatedEmail')
    @ApiBody({ type: SendTicketCreatedEmailModel })
    async sendTicketCreatedEmail(@Body() req: SendTicketCreatedEmailModel): Promise<GlobalResponse> {
        try {
            const result = await this.emailService.sendTicketCreatedEmail(req);
            return new GlobalResponse(result, result ? 200 : 500, result ? 'Email sent successfully' : 'Failed to send email');
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('sendPasswordResetEmail')
    @ApiBody({ type: SendPasswordResetEmailModel })
    async sendPasswordResetEmail(@Body() req: SendPasswordResetEmailModel): Promise<GlobalResponse> {
        try {
            const result = await this.emailService.sendPasswordResetEmail(req);
            return new GlobalResponse(result, result ? 200 : 500, result ? 'Email sent successfully' : 'Failed to send email');
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('sendAccessRequestEmail')
    @ApiBody({ type: RequestAccessModel })
    async sendAccessRequestEmail(@Body() req: RequestAccessModel): Promise<GlobalResponse> {
        try {
            const result = await this.emailService.sendAccessRequestEmail(req);
            return new GlobalResponse(result, result ? 200 : 500, result ? 'Email sent successfully' : 'Failed to send email');
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Get('getAllAccessRequests')
    async getAllAccessRequests(): Promise<GlobalResponse> {
        try {
            const requests = await this.emailService.getAllAccessRequests();
            return new GlobalResponse(true, 200, "Access requests fetched successfully", requests as any);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }
}
