import { Injectable } from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { CredentialVaultRepository } from './repositories/credential-vault.repository';
import { GlobalResponse, ErrorResponse } from '@bosvault/backend-utils';
import { CreateCredentialVaultModel, UpdateCredentialVaultModel, GetAllCredentialVaultResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { CredentialVaultEntity } from './entities/credential-vault.entity';
import { GenericTransactionManager } from '../../../../database/typeorm-transactions';

@Injectable()
export class CredentialVaultService {
    constructor(
        private dataSource: DataSource,
        private vaultRepo: CredentialVaultRepository
    ) { }

    async createCredentialVault(reqModel: CreateCredentialVaultModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.appName) throw new ErrorResponse(0, "App Name is required");
            if (!reqModel.password) throw new ErrorResponse(0, "Password is required");

            const existing = await this.vaultRepo.findOne({ where: { appName: reqModel.appName } });
            if (existing) throw new ErrorResponse(0, "Credential Vault with this App Name already exists");

            await transManager.startTransaction();
            const newVault = new CredentialVaultEntity();
            newVault.userId = reqModel.createdBy;
            newVault.appName = reqModel.appName;
            newVault.description = reqModel.description;
            newVault.password = reqModel.password;
            newVault.owner = reqModel.owner;
            newVault.deviceSerialNumber = reqModel.deviceSerialNumber;
            newVault.ipAddress = reqModel.ipAddress;
            newVault.recoveryEmail = reqModel.recoveryEmail;
            newVault.isActive = reqModel.isActive ?? true;

            if (reqModel.expireDate) {
                const eDate = new Date(reqModel.expireDate);
                if (!isNaN(eDate.getTime())) {
                    newVault.expireDate = eDate;
                }
            }

            await transManager.getRepository(CredentialVaultEntity).save(newVault);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 201, 'Credential Vault created successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getCredentialVault(reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            const vault = await this.vaultRepo.findOne({ where: { id: reqModel.id } });
            if (!vault) throw new ErrorResponse(404, 'Credential Vault not found');
            return new GlobalResponse(true, 200, 'Credential Vault retrieved successfully', vault);
        } catch (error) { throw error; }
    }

    async getAllCredentialVaults(): Promise<GetAllCredentialVaultResponseModel> {
        try {
            const vaultList = await this.vaultRepo.find();
            const mappedList = vaultList.map(vault => ({
                id: vault.id,
                companyId: 0,
                appName: vault.appName,
                description: vault.description,
                password: vault.password,
                expireDate: vault.expireDate,
                owner: vault.owner,
                deviceSerialNumber: vault.deviceSerialNumber,
                ipAddress: vault.ipAddress,
                recoveryEmail: vault.recoveryEmail,
                isActive: vault.isActive,
                createdBy: vault.userId,
                createdAt: vault.createdAt,
                updatedAt: vault.updatedAt
            }));
            return new GetAllCredentialVaultResponseModel(true, 200, 'Credential Vaults retrieved successfully', mappedList);
        } catch (error) { throw error; }
    }

    async updateCredentialVault(reqModel: UpdateCredentialVaultModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existing = await this.vaultRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) throw new ErrorResponse(404, 'Credential Vault not found');

            if (reqModel.appName !== undefined && reqModel.appName.trim() === '') throw new ErrorResponse(0, 'App Name cannot be empty');

            if (reqModel.appName) {
                const existingApp = await this.vaultRepo.findOne({ where: { appName: reqModel.appName, id: Not(reqModel.id) } });
                if (existingApp) throw new ErrorResponse(0, "Credential Vault with this App Name already exists");
            }

            await transManager.startTransaction();
            const updateData: Partial<CredentialVaultEntity> = {};
            if (reqModel.appName !== undefined) updateData.appName = reqModel.appName;
            if (reqModel.description !== undefined) updateData.description = reqModel.description;
            if (reqModel.password !== undefined) updateData.password = reqModel.password;
            if (reqModel.owner !== undefined) updateData.owner = reqModel.owner;
            if (reqModel.deviceSerialNumber !== undefined) updateData.deviceSerialNumber = reqModel.deviceSerialNumber;
            if (reqModel.ipAddress !== undefined) updateData.ipAddress = reqModel.ipAddress;
            if (reqModel.recoveryEmail !== undefined) updateData.recoveryEmail = reqModel.recoveryEmail;
            if (reqModel.isActive !== undefined) updateData.isActive = reqModel.isActive;
            if (reqModel.expireDate) updateData.expireDate = new Date(reqModel.expireDate);

            await transManager.getRepository(CredentialVaultEntity).update(reqModel.id, updateData);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Credential Vault updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async deleteCredentialVault(reqModel: IdRequestModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            await transManager.startTransaction();
            const repo = transManager.getRepository(CredentialVaultEntity);
            const delEntity = await repo.findOne({ where: { id: reqModel.id } });
            if (delEntity) await repo.remove(delEntity);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Credential Vault deleted successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
