import { Body, Controller, Post, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ApiBody, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { EmployeesService } from './employees.service';
import { EmployeesBulkService } from './employees-bulk.service';
import { CreateEmployeeModel, UpdateEmployeeModel, DeleteEmployeeModel, GetEmployeeModel, GetAllEmployeesResponseModel, GetEmployeeResponseModel, BulkImportResponseModel, BulkImportRequestModel, GetAllEmployeesRequestModel } from '@bosvault/shared-models';

@ApiTags('Employees')
@Controller('employees')
export class EmployeesController {
    constructor(
        private service: EmployeesService,
        private bulkService: EmployeesBulkService
    ) { }

    @Post('bulk-import')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                companyId: { type: 'number' },
                userId: { type: 'number' }
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async bulkImport(@Req() req: any, @UploadedFile() file: any, @Body('companyId') companyId: number, @Body('userId') userId: number): Promise<BulkImportResponseModel> {
        try {
            if (!file) {
                return new BulkImportResponseModel(false, 400, 'No file provided', 0, 0, []);
            }
            const reqModel = new BulkImportRequestModel(file.buffer, Number(companyId), Number(userId));
            return await this.bulkService.processBulkImport(reqModel, req.user);
        } catch (error) {
            return returnException(BulkImportResponseModel, error);
        }
    }

    @Post('createEmployee')
    @ApiBody({ type: CreateEmployeeModel })
    async createEmployee(@Req() req: any, @Body() reqModel: CreateEmployeeModel): Promise<GlobalResponse> {
        try {
            return await this.service.createEmployee(reqModel, req.user);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateEmployee')
    @ApiBody({ type: UpdateEmployeeModel })
    async updateEmployee(@Req() req: any, @Body() reqModel: UpdateEmployeeModel): Promise<GlobalResponse> {
        try {
            return await this.service.updateEmployee(reqModel, req.user);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getEmployee')
    @ApiBody({ type: GetEmployeeModel })
    async getEmployee(@Req() req: any, @Body() reqModel: GetEmployeeModel): Promise<GetEmployeeResponseModel> {
        try {
            return await this.service.getEmployee(reqModel, req.user);
        } catch (error) {
            return returnException(GetEmployeeResponseModel, error);
        }
    }

    @Post('getAllEmployees')
    @ApiBody({ type: GetAllEmployeesRequestModel })
    async getAllEmployees(@Req() req: any, @Body() reqModel: GetAllEmployeesRequestModel): Promise<GetAllEmployeesResponseModel> {
        try {
            return await this.service.getAllEmployees(reqModel, req.user);
        } catch (error) {
            return returnException(GetAllEmployeesResponseModel, error);
        }
    }

    @Post('deleteEmployee')
    @ApiBody({ type: DeleteEmployeeModel })
    async deleteEmployee(@Req() req: any, @Body() reqModel: DeleteEmployeeModel): Promise<GlobalResponse> {
        try {
            return await this.service.deleteEmployee(reqModel, req.user);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

}
