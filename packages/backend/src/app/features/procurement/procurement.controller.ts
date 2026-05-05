import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { CreatePOModel, UpdatePOModel, GetAllPOsModel, GetPOByIdModel, GetAllPOsCompanyIdRequestModel, GetPORequestModel, UpdatePOStatusRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Procurement')
@Controller('procurement')
@UseGuards(JwtAuthGuard)
export class ProcurementController {
    constructor(private readonly service: ProcurementService) { }

    @Post('createPurchaseOrder')
    @ApiBody({ type: CreatePOModel })
    async createPurchaseOrder(@Body() reqModel: CreatePOModel): Promise<GlobalResponse> {
        try {
            return await this.service.createPurchaseOrder(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updatePurchaseOrder')
    @ApiBody({ type: UpdatePOModel })
    async updatePurchaseOrder(@Body() reqModel: UpdatePOModel): Promise<GlobalResponse> {
        try {
            return await this.service.updatePurchaseOrder(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getAllPurchaseOrders')
    async getAllPurchaseOrders(): Promise<GetAllPOsModel> {
        try {
            return await this.service.getAllPurchaseOrders();
        } catch (error) {
            return returnException(GetAllPOsModel, error);
        }
    }

    @Post('getPurchaseOrderByCompanyId')
    @ApiBody({ type: GetAllPOsCompanyIdRequestModel })
    async getPurchaseOrderByCompanyId(@Body() reqModel: GetAllPOsCompanyIdRequestModel): Promise<GetAllPOsModel> {
        try {
            return await this.service.getPurchaseOrderByCompanyId(reqModel);
        } catch (error) {
            return returnException(GetAllPOsModel, error);
        }
    }

    @Post('getPurchaseOrderById')
    @ApiBody({ type: GetPORequestModel })
    async getPurchaseOrderById(@Body() reqModel: GetPORequestModel): Promise<GetPOByIdModel> {
        try {
            return await this.service.getPurchaseOrderById(reqModel);
        } catch (error) {
            return returnException(GetPOByIdModel, error);
        }
    }

    @Post('updatePOStatus')
    @ApiBody({ type: UpdatePOStatusRequestModel })
    async updatePOStatus(@Body() reqModel: UpdatePOStatusRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.updatePOStatus(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('deletePurchaseOrder')
    @ApiBody({ type: GetPORequestModel })
    async deletePurchaseOrder(@Body() reqModel: GetPORequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.deletePurchaseOrder(reqModel.id);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }
}
