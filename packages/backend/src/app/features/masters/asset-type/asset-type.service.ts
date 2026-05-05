import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AssetTypeRepository } from './repositories/asset-type.repository';
import { GlobalResponse, ErrorResponse } from '@bosvault/backend-utils';
import { CreateAssetTypeModel, UpdateAssetTypeModel, GetAllAssetTypesResponseModel, CreateAssetTypeResponseModel, AssetTypeDropdownModel, AssetTypeDropdownResponse, IdRequestModel } from '@bosvault/shared-models';
import { AssetTypeMasterEntity } from './entities/asset-type.entity';
import { GenericTransactionManager } from '../../../../database/typeorm-transactions';
import { PurchaseOrderItemEntity } from '../../procurement/entities/purchase-order-item.entity';
import { DeviceConfigEntity } from '../brand/entities/brand.entity';
import { AssetInfoEntity } from '../../asset-info/entities/asset-info.entity';

@Injectable()
export class AssetTypeService {
    constructor(
        private dataSource: DataSource,
        private assetTypeRepo: AssetTypeRepository,
    ) { }

    async createAssetType(reqModel: CreateAssetTypeModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.name) {
                throw new ErrorResponse(0, "Asset Type name is required");
            }

            const existingName = await this.assetTypeRepo.findOne({ where: { name: reqModel.name } });
            if (existingName) {
                throw new ErrorResponse(0, "Asset Type with this name already exists");
            }



            await transManager.startTransaction();
            const entiSave = new AssetTypeMasterEntity();
            entiSave.name = reqModel.name;
            entiSave.description = reqModel.description;
            entiSave.isActive = reqModel.isActive;
            entiSave.userId = reqModel.userId;
            await transManager.getRepository(AssetTypeMasterEntity).save(entiSave);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 201, 'Asset Type created successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async updateAssetType(reqModel: UpdateAssetTypeModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, 'Asset Type ID is required');
            }

            const existing = await this.assetTypeRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Asset Type not found');
            }

            if (reqModel.name !== undefined && reqModel.name.trim() === '') {
                throw new ErrorResponse(0, 'Asset Type name cannot be empty');
            }



            await transManager.startTransaction();
            await transManager.getRepository(AssetTypeMasterEntity).update(reqModel.id, { name: reqModel.name, description: reqModel.description, isActive: reqModel.isActive });
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Asset Type updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getAssetType(reqModel: IdRequestModel): Promise<CreateAssetTypeResponseModel> {
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Asset Type ID is required");
            }

            const assetType = await this.assetTypeRepo.findOne({ where: { id: reqModel.id } });
            if (!assetType) {
                throw new ErrorResponse(0, "Asset Type not found");
            }

            return new CreateAssetTypeResponseModel(true, 200, "Asset Type retrieved successfully", assetType);
        } catch (error) {
            throw error;
        }
    }

    async getAllAssetTypes(): Promise<GetAllAssetTypesResponseModel> {
        try {
            const assetTypes = await this.assetTypeRepo.find();
            const assetTypesWithCompanyName = assetTypes.map(asset => ({ id: asset.id, userId: asset.userId, createdAt: asset.createdAt, updatedAt: asset.updatedAt, name: asset.name, description: asset.description, isActive: asset.isActive, companyName: '' }));
            return new GetAllAssetTypesResponseModel(true, 200, 'Asset Types retrieved successfully', assetTypesWithCompanyName);
        } catch (error) {
            throw error;
        }
    }

    async getAllAssetTypesDropdown(): Promise<AssetTypeDropdownResponse> {
        try {
            const assetTypes = await this.assetTypeRepo.find({ select: ['id', 'name'] });
            const dropdownData = assetTypes.map(asset => new AssetTypeDropdownModel(asset.id, asset.name));
            return new AssetTypeDropdownResponse(true, 200, "Asset Types retrieved successfully", dropdownData);
        } catch (error) {
            throw error;
        }
    }

    async deleteAssetType(reqModel: IdRequestModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Asset Type ID is required");
            }

            const existing = await this.assetTypeRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(0, 'Asset Type not found');
            }

            // Check if asset type is being used in purchase order items
            const poItemCount = await this.dataSource.getRepository(PurchaseOrderItemEntity).count({ where: { assetTypeId: reqModel.id } });
            if (poItemCount > 0) {
                throw new ErrorResponse(0, `Cannot delete asset type as it is associated with ${poItemCount} purchase order item(s)`);
            }

            // Check if asset type is being used in device configurations (by name)
            const deviceConfigCount = await this.dataSource.getRepository(DeviceConfigEntity).count({ where: { assetType: existing.name } });
            if (deviceConfigCount > 0) {
                throw new ErrorResponse(0, `Cannot delete asset type as it is associated with ${deviceConfigCount} device configuration(s)`);
            }

            await transManager.startTransaction();
            await transManager.getRepository(AssetTypeMasterEntity).delete(reqModel.id);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Asset Type deleted successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
