import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CredentialVaultService } from './credential-vault.service';
import { CreateCredentialVaultModel, UpdateCredentialVaultModel, GetAllCredentialVaultResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, returnException } from '@bosvault/backend-utils';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Credential Vault Master')
@Controller('credential-vault')
@UseGuards(JwtAuthGuard)
export class CredentialVaultController {
    constructor(private vaultService: CredentialVaultService) { }

    @Post('createCredentialVault')
    @ApiBody({ type: CreateCredentialVaultModel })
    async createCredentialVault(@Body() reqModel: CreateCredentialVaultModel): Promise<GlobalResponse> {
        try {
            return await this.vaultService.createCredentialVault(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateCredentialVault')
    @ApiBody({ type: UpdateCredentialVaultModel })
    async updateCredentialVault(@Body() reqModel: UpdateCredentialVaultModel): Promise<GlobalResponse> {
        try {
            return await this.vaultService.updateCredentialVault(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getCredentialVault')
    @ApiBody({ type: IdRequestModel })
    async getCredentialVault(@Body() reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.vaultService.getCredentialVault(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getAllCredentialVaults')
    async getAllCredentialVaults(): Promise<GetAllCredentialVaultResponseModel> {
        try {
            return await this.vaultService.getAllCredentialVaults();
        } catch (error) {
            return returnException(GetAllCredentialVaultResponseModel, error);
        }
    }

    @Post('deleteCredentialVault')
    @ApiBody({ type: IdRequestModel })
    async deleteCredentialVault(@Body() reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.vaultService.deleteCredentialVault(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Get('list')
    async list() {
        return this.vaultService.getAllCredentialVaults();
    }

    @Get('reveal/:id')
    async reveal(@Param('id') id: number) {
        return this.vaultService.getCredentialVault({ id });
    }
}
