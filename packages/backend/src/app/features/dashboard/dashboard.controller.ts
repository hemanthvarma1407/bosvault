import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { returnException } from '@bosvault/backend-utils';
import { DashboardStatsResponseModel, IdRequestModel } from '@bosvault/shared-models';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Post('getDashboardStats')
    @ApiBody({ type: IdRequestModel })
    @ApiResponse({ type: DashboardStatsResponseModel })
    async getDashboardStats(@Body() reqModel: IdRequestModel): Promise<DashboardStatsResponseModel> {
        try {
            return await this.dashboardService.getDashboardStats(reqModel);
        } catch (error) {
            return returnException(DashboardStatsResponseModel, error);
        }
    }
}
