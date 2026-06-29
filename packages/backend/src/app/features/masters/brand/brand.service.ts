import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DeviceConfigRepository } from './repositories/brand.repository';
import { CompanyInfoRepository } from '../company-info/repositories/company-info.repository';
import { GlobalResponse, ErrorResponse } from '@bosvault/backend-utils';
import { CreateDeviceConfigModel, UpdateDeviceConfigModel, IdRequestModel, GetAllDeviceConfigsResponseModel } from '@bosvault/shared-models';
import { DeviceConfigEntity } from './entities/brand.entity';
import { GenericTransactionManager } from '../../../../database/typeorm-transactions';
import { AssetInfoEntity } from '../../asset-info/entities/asset-info.entity';

@Injectable()
export class DeviceConfigService {
    constructor(
        private dataSource: DataSource,
        private deviceConfigRepo: DeviceConfigRepository,
        private companyRepo: CompanyInfoRepository
    ) { }

    async createDeviceConfig(reqModel: CreateDeviceConfigModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            // Removed uniqueness check to allow device config variations
            await transManager.startTransaction();
            const saveEnti = new DeviceConfigEntity();
            saveEnti.laptopCompany = reqModel.laptopCompany;
            saveEnti.model = reqModel.model;
            saveEnti.isActive = reqModel.isActive ?? true;
            saveEnti.configuration = reqModel.configuration;
            saveEnti.ram = reqModel.ram;
            saveEnti.storage = reqModel.storage;
            saveEnti.assetType = reqModel.assetType;
            saveEnti.userId = reqModel.userId;
            await transManager.getRepository(DeviceConfigEntity).save(saveEnti);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 201, 'Device configuration created successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getAllDeviceConfigs(): Promise<GetAllDeviceConfigsResponseModel> {
        try {
            const configs = await this.deviceConfigRepo.find();
            const mappedConfigs = configs.map(config => ({
                id: config.id,
                userId: config.userId,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt,
                name: `${config.laptopCompany} ${config.model}`,
                description: config.configuration,
                isActive: config.isActive,
                laptopCompany: config.laptopCompany,
                model: config.model,
                configuration: config.configuration,
                ram: config.ram,
                storage: config.storage,
                assetType: config.assetType
            }));
            return new GetAllDeviceConfigsResponseModel(true, 200, 'Device configurations retrieved successfully', mappedConfigs);
        } catch (error) {
            throw error;
        }
    }


    async updateDeviceConfig(reqModel: UpdateDeviceConfigModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existing = await this.deviceConfigRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Device configuration not found');
            }

            await transManager.startTransaction();
            await transManager.getRepository(DeviceConfigEntity).update(reqModel.id, {
                laptopCompany: reqModel.laptopCompany,
                model: reqModel.model,
                isActive: reqModel.isActive,
                configuration: reqModel.configuration,
                ram: reqModel.ram,
                storage: reqModel.storage,
                assetType: reqModel.assetType
            });
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Device configuration updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async deleteDeviceConfig(reqModel: IdRequestModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const delEntity = await this.deviceConfigRepo.findOne({ where: { id: reqModel.id } });
            if (!delEntity) {
                throw new ErrorResponse(404, 'Device configuration not found');
            }
            // Check if configuration is being used by assets
            const assetsCount = await this.dataSource.getRepository(AssetInfoEntity).count({ where: { deviceConfigId: reqModel.id } });
            if (assetsCount > 0) {
                throw new ErrorResponse(0, `Cannot delete device configuration as it is associated with ${assetsCount} asset(s)`);
            }

            await transManager.startTransaction();
            await transManager.getRepository(DeviceConfigEntity).remove(delEntity);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Device configuration deleted successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
