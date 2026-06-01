import { Body, Controller, Post, Get, Param, Res, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import express from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { TicketsService } from './tickets.service';
import { CreateTicketModel, UpdateTicketModel, DeleteTicketModel, GetTicketModel, GetAllTicketsModel, GetTicketByIdModel, IdRequestModel, UpdateTicketStatusRequestModel, AssignTicketRequestModel, AddTicketResponseRequestModel, GetTicketStatisticsRequestModel } from '@bosvault/shared-models';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Public } from '../../decorators/public.decorator';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
    constructor(private service: TicketsService) { }

    @Post('createTicket')
    @ApiBody({ type: CreateTicketModel })
    async createTicket(@Body() reqModel: CreateTicketModel, @Req() req: any): Promise<GlobalResponse> {
        try {
            const userId = req.user?.id || req.user?.userId;
            const userEmail = req.user?.email;
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            return await this.service.createTicket(reqModel, userId, userEmail, ipAddress);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateTicket')
    @ApiBody({ type: UpdateTicketModel })
    async updateTicket(@Body() reqModel: UpdateTicketModel, @Req() req: any): Promise<GlobalResponse> {
        try {
            const userId = req.user?.id || req.user?.userId;
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            return await this.service.updateTicket(reqModel, userId, ipAddress);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getTicket')
    @ApiBody({ type: GetTicketModel })
    async getTicket(@Body() reqModel: GetTicketModel): Promise<GetTicketByIdModel> {
        try {
            return await this.service.getTicket(reqModel);
        } catch (error) {
            return returnException(GetTicketByIdModel, error);
        }
    }

    @Post('getAllTickets')
    @ApiBody({ type: IdRequestModel })
    async getAllTickets(@Body() reqModel: IdRequestModel): Promise<GetAllTicketsModel> {
        try {
            return await this.service.getAllTickets(reqModel.id);
        } catch (error) {
            return returnException(GetAllTicketsModel, error);
        }
    }

    @Post('deleteTicket')
    @ApiBody({ type: DeleteTicketModel })
    async deleteTicket(@Body() reqModel: DeleteTicketModel): Promise<GlobalResponse> {
        try {
            return await this.service.deleteTicket(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getMyTickets')
    async getMyTickets(@Req() req: any): Promise<GetAllTicketsModel> {
        try {
            return await this.service.getTicketsByUser(req.user?.email);
        } catch (error) {
            return returnException(GetAllTicketsModel, error);
        }
    }

    @Post('getUserTickets')
    async getUserTickets(@Body() reqModel: { email: string }): Promise<GetAllTicketsModel> {
        try {
            return await this.service.getTicketsByUser(reqModel.email);
        } catch (error) {
            return returnException(GetAllTicketsModel, error);
        }
    }

    @Post('statistics')
    @ApiBody({ type: GetTicketStatisticsRequestModel })
    async getStatistics(@Body() reqModel: GetTicketStatisticsRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.getStatistics(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('status')
    @ApiBody({ type: UpdateTicketStatusRequestModel })
    async updateStatus(@Body() reqModel: UpdateTicketStatusRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.updateStatus(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('assign')
    @ApiBody({ type: AssignTicketRequestModel })
    async assignTicket(@Body() reqModel: AssignTicketRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.assignTicket(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('addResponse')
    @ApiBody({ type: AddTicketResponseRequestModel })
    async addResponse(@Body() reqModel: AddTicketResponseRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.addResponse(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('upload-attachment')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAttachment(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any
    ): Promise<GlobalResponse> {
        try {
            return await this.service.uploadAttachment(file, req.user?.userId || req.user?.id);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Public()
    @Get('attachment/:filename')
    async getAttachment(@Param('filename') filename: string, @Res() res: express.Response) {
        try {
            const filePath = this.service.getAttachment(filename);
            res.sendFile(filePath);
        } catch (error) {
            res.status(500).json(returnException(GlobalResponse, error));
        }
    }
}
