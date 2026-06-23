import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LicenseRepository } from './repositories/license.repository';
import { GlobalResponse, ErrorResponse } from '@bosvault/backend-utils';
import { CreateLicenseMasterModel, UpdateLicenseMasterModel, GetAllLicenseMastersResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { LicensesMasterEntity } from './entities/license.entity';
import { GenericTransactionManager } from '../../../../database/typeorm-transactions';
import { CompanyLicenseEntity } from '../../licenses/entities/company-license.entity';

@Injectable()
export class LicenseService {
    constructor(
        private dataSource: DataSource,
        private licenseRepo: LicenseRepository
    ) { }

    async createLicense(reqModel: CreateLicenseMasterModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.name) {
                throw new ErrorResponse(0, "License name is required");
            }

            const existingName = await this.licenseRepo.findOne({ where: { name: reqModel.name } });
            if (existingName) {
                throw new ErrorResponse(0, "License with this name already exists");
            }

            await transManager.startTransaction();
            const newLicense = new LicensesMasterEntity();
            newLicense.userId = reqModel.userId;
            newLicense.name = reqModel.name;
            newLicense.description = reqModel.description;
            newLicense.isActive = reqModel.isActive;

            // Handle dates
            if (reqModel.purchaseDate) {
                const pDate = new Date(reqModel.purchaseDate);
                if (!isNaN(pDate.getTime())) {
                    newLicense.purchaseDate = reqModel.purchaseDate;
                }
            }
            if (reqModel.expiryDate) {
                const eDate = new Date(reqModel.expiryDate);
                if (!isNaN(eDate.getTime())) {
                    newLicense.expiryDate = reqModel.expiryDate;
                }
            }
            newLicense.totalQuantity = reqModel.totalQuantity;

            await transManager.getRepository(LicensesMasterEntity).save(newLicense);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 201, 'License created successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getLicense(reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            const license = await this.licenseRepo.findOne({ where: { id: reqModel.id } });
            if (!license) {
                throw new ErrorResponse(404, 'License not found');
            }
            return new GlobalResponse(true, 200, 'License retrieved successfully', license);
        } catch (error) {
            throw error;
        }
    }

    async getAllLicenses(): Promise<GetAllLicenseMastersResponseModel> {
        try {
            const licenses = await this.licenseRepo.find();

            // Return licenses directly as usedCount is now a persisted field
            // We can still verify with a quick check if needed, but for better performance 
            // and based on user request to have it "increase", we lean on the persisted column.
            return new GetAllLicenseMastersResponseModel(true, 200, 'Licenses retrieved successfully', licenses as any);
        } catch (error) {
            throw error;
        }
    }

    async updateUsedCount(applicationId: number | string): Promise<void> {
        try {
            const count = await this.dataSource.getRepository(CompanyLicenseEntity)
                .count({
                    where: {
                        applicationId: Number(applicationId),
                        assignedEmployeeId: BigInt(0) as any // Placeholder check, better explicitly check not null
                    }
                });

            // Use QueryBuilder for more control over NOT NULL
            const result = await this.dataSource.getRepository(CompanyLicenseEntity)
                .createQueryBuilder('l')
                .where('l.applicationId = :applicationId', { applicationId })
                .andWhere('l.assignedEmployeeId IS NOT NULL')
                .getCount();

            await this.licenseRepo.update(applicationId, { usedCount: result });
        } catch (error) {
            console.error(`Failed to update used count for license ${applicationId}`, error);
        }
    }

    async updateLicense(reqModel: UpdateLicenseMasterModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existing = await this.licenseRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'License not found');
            }

            if (reqModel.name !== undefined && reqModel.name.trim() === '') {
                throw new ErrorResponse(0, 'License name cannot be empty');
            }

            await transManager.startTransaction();

            // Update fields manually or use object spread, but be careful with undefined
            const updateData: Partial<LicensesMasterEntity> = {
                name: reqModel.name,
                description: reqModel.description,
                isActive: reqModel.isActive,
                purchaseDate: reqModel.purchaseDate,
                expiryDate: reqModel.expiryDate,
                totalQuantity: reqModel.totalQuantity
            };

            await transManager.getRepository(LicensesMasterEntity).update(reqModel.id, updateData);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'License updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async deleteLicense(reqModel: IdRequestModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {

            const delEntity = await this.licenseRepo.findOne({ where: { id: reqModel.id } });

            if (delEntity && delEntity.usedCount > 0) {
                throw new ErrorResponse(0, `Cannot delete license as it has ${delEntity.usedCount} active assignments`);
            }

            await transManager.startTransaction();
            await transManager.getRepository(LicensesMasterEntity).delete(reqModel.id);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'License deleted successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
