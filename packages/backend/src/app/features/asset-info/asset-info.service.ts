import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GenericTransactionManager } from '../../../database/typeorm-transactions';
import { CreateAssetModel, UpdateAssetModel, DeleteAssetModel, GetAssetModel, GetAllAssetsModel, GetAssetByIdModel, AssetResponseModel, AssetStatisticsResponseModel, AssetSearchRequestModel, GetAssetsWithAssignmentsResponseModel, AssetStatusEnum, IdRequestModel, CreateAssetAssignModel, UpdateAssetAssignModel, GetAssetAssignModel, AssignAssetOpRequestModel, ReturnAssetOpRequestModel, GetExpiringWarrantyRequestModel, NotificationType, GlobalResponse } from '@bosvault/shared-models';
import { AssetInfoEntity } from './entities/asset-info.entity';
import { AssetAssignEntity } from './entities/asset-assign.entity';
import { AssetInfoRepository } from './repositories/asset-info.repository';
import { AssetAssignRepository } from './repositories/asset-assign.repository';
import { LessThan, IsNull } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GetAllAssetAssignsModel, GetAssetAssignByIdModel, SendAssetAssignedEmailModel, UserRoleEnum } from '@bosvault/shared-models';
import { EmailInfoService } from '../email/email-info.service';
import { EmployeesEntity } from '../employees/entities/employees.entity';
import { AuthUsersEntity } from '../auth-users/entities/auth-users.entity';
import { AssetReturnHistoryEntity } from './entities/asset-return-history.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ErrorResponse } from '@bosvault/backend-utils';

@Injectable()
export class AssetInfoService {
    constructor(
        private dataSource: DataSource,
        private assetInfoRepo: AssetInfoRepository,
        private assignRepo: AssetAssignRepository,
        private emailInfoService: EmailInfoService,
        private notificationsService: NotificationsService
    ) { }

    async createAsset(reqModel: CreateAssetModel, userId?: number): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.companyId || !reqModel.deviceId || !reqModel.serialNumber) {
                throw new ErrorResponse(0, "Company ID, Device ID and Serial Number are required");
            }

            const existingModel = await this.assetInfoRepo.findOne({ where: { serialNumber: reqModel.serialNumber } });
            if (existingModel) {
                throw new ErrorResponse(0, "Serial number already exists");
            }

            await transManager.startTransaction();
            const entity = new AssetInfoEntity();
            entity.companyId = reqModel.companyId;
            entity.deviceId = reqModel.deviceId;
            entity.serialNumber = reqModel.serialNumber;
            entity.deviceConfigId = reqModel.deviceConfigId;
            entity.model = reqModel.model;
            entity.configuration = reqModel.configuration;
            entity.assignedToEmployeeId = reqModel.assignedToEmployeeId;
            entity.previousUserEmployeeId = reqModel.previousUserEmployeeId;
            entity.purchaseDate = reqModel.purchaseDate ? new Date(reqModel.purchaseDate) : null;
            entity.warrantyExpiry = reqModel.warrantyExpiry ? new Date(reqModel.warrantyExpiry) : null;
            entity.userAssignedDate = reqModel.userAssignedDate ? new Date(reqModel.userAssignedDate) : null;
            entity.lastReturnDate = reqModel.lastReturnDate ? new Date(reqModel.lastReturnDate) : null;
            entity.complianceStatus = reqModel.complianceStatus;
            entity.lastSync = reqModel.lastSync ? new Date(reqModel.lastSync) : null;
            entity.encryptionStatus = reqModel.encryptionStatus;
            entity.batteryLevel = reqModel.batteryLevel;
            entity.storageAvailable = reqModel.storageAvailable;
            entity.purchaseCost = reqModel.purchaseCost;
            entity.currentValue = reqModel.currentValue;
            entity.depreciationMethod = reqModel.depreciationMethod;
            entity.usefulLifeYears = reqModel.usefulLifeYears;
            entity.salvageValue = reqModel.salvageValue;
            entity.assetStatusEnum = reqModel.assignedToEmployeeId ? ((reqModel.assetStatusEnum === AssetStatusEnum.MAINTENANCE || reqModel.assetStatusEnum === AssetStatusEnum.RETIRED) ? reqModel.assetStatusEnum : AssetStatusEnum.IN_USE) : (reqModel.assetStatusEnum || AssetStatusEnum.AVAILABLE);
            const saved = await transManager.getRepository(AssetInfoEntity).save(entity);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 0, "Asset created successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async updateAsset(reqModel: UpdateAssetModel, userId?: number): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Asset ID is required");
            }

            const existing = await this.assetInfoRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(0, "Asset not found");
            }

            await transManager.startTransaction();
            existing.companyId = reqModel.companyId;
            existing.deviceId = reqModel.deviceId;
            existing.serialNumber = reqModel.serialNumber;
            existing.deviceConfigId = reqModel.deviceConfigId;
            existing.model = reqModel.model;
            existing.configuration = reqModel.configuration;
            existing.assignedToEmployeeId = reqModel.assignedToEmployeeId !== undefined ? reqModel.assignedToEmployeeId : existing.assignedToEmployeeId;
            existing.previousUserEmployeeId = reqModel.previousUserEmployeeId !== undefined ? reqModel.previousUserEmployeeId : existing.previousUserEmployeeId;
            existing.purchaseDate = reqModel.purchaseDate !== undefined ? (reqModel.purchaseDate ? new Date(reqModel.purchaseDate) : null) : existing.purchaseDate;
            existing.warrantyExpiry = reqModel.warrantyExpiry !== undefined ? (reqModel.warrantyExpiry ? new Date(reqModel.warrantyExpiry) : null) : existing.warrantyExpiry;
            existing.userAssignedDate = reqModel.userAssignedDate !== undefined ? (reqModel.userAssignedDate ? new Date(reqModel.userAssignedDate) : null) : existing.userAssignedDate;
            existing.lastReturnDate = reqModel.lastReturnDate !== undefined ? (reqModel.lastReturnDate ? new Date(reqModel.lastReturnDate) : null) : existing.lastReturnDate;

            existing.complianceStatus = reqModel.complianceStatus || existing.complianceStatus;
            existing.lastSync = reqModel.lastSync ? new Date(reqModel.lastSync) : existing.lastSync;
            existing.encryptionStatus = reqModel.encryptionStatus || existing.encryptionStatus;
            existing.batteryLevel = reqModel.batteryLevel ?? existing.batteryLevel;
            existing.storageAvailable = reqModel.storageAvailable || existing.storageAvailable;
            existing.purchaseCost = reqModel.purchaseCost ?? existing.purchaseCost;
            existing.currentValue = reqModel.currentValue ?? existing.currentValue;
            existing.depreciationMethod = reqModel.depreciationMethod || existing.depreciationMethod;
            existing.usefulLifeYears = reqModel.usefulLifeYears ?? existing.usefulLifeYears;
            existing.salvageValue = reqModel.salvageValue ?? existing.salvageValue;
            existing.userId = userId || existing.userId;

            // Only update status if explicitly provided, otherwise keep existing
            // If assignedToEmployeeId is being set (or already exists and not being cleared), ensure status reflects IN_USE unless specific status overrides
            const effectiveAssignedTo = reqModel.assignedToEmployeeId !== undefined ? reqModel.assignedToEmployeeId : existing.assignedToEmployeeId;

            if (reqModel.assetStatusEnum) {
                existing.assetStatusEnum = reqModel.assetStatusEnum;
            } else if (effectiveAssignedTo) {
                // If assigned, ensure it's not available
                if (existing.assetStatusEnum === AssetStatusEnum.AVAILABLE) {
                    existing.assetStatusEnum = AssetStatusEnum.IN_USE;
                }
            }
            const saved = await transManager.getRepository(AssetInfoEntity).save(existing);
            await transManager.completeTransaction();


            return new GlobalResponse(true, 0, "Asset updated successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getAsset(reqModel: GetAssetModel): Promise<GetAssetByIdModel> {
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Asset ID is required");
            }

            const asset = await this.assetInfoRepo.findOne({ where: { id: reqModel.id } });
            if (!asset) {
                throw new ErrorResponse(0, "Asset not found");
            }

            const response = new AssetResponseModel(asset.id, asset.companyId, asset.deviceId, asset.serialNumber, asset.assetStatusEnum, asset.createdAt, asset.updatedAt, asset.purchaseDate, asset.warrantyExpiry, asset.deviceConfigId, asset.model, asset.configuration, asset.assignedToEmployeeId, asset.previousUserEmployeeId, asset.userAssignedDate, asset.lastReturnDate, asset.boxNo, asset.complianceStatus, asset.lastSync, asset.encryptionStatus, asset.batteryLevel, asset.storageAvailable, asset.purchaseCost, asset.currentValue, asset.depreciationMethod, asset.usefulLifeYears, asset.salvageValue);
            return new GetAssetByIdModel(true, 0, "Asset retrieved successfully", response);
        } catch (error) {
            throw error;
        }
    }

    async getAllAssets(reqModel: IdRequestModel): Promise<GetAllAssetsModel> {
        try {
            const companyId = reqModel.id;
            const assets = companyId ? await this.assetInfoRepo.find({ where: { companyId } }) : await this.assetInfoRepo.find();
            const responses = assets.map(a => new AssetResponseModel(a.id, a.companyId, a.deviceId, a.serialNumber, a.assetStatusEnum, a.createdAt, a.updatedAt, a.purchaseDate, a.warrantyExpiry, a.deviceConfigId, a.model, a.configuration, a.assignedToEmployeeId, a.previousUserEmployeeId, a.userAssignedDate, a.lastReturnDate, a.boxNo, a.complianceStatus, a.lastSync, a.encryptionStatus, a.batteryLevel, a.storageAvailable, a.purchaseCost, a.currentValue, a.depreciationMethod, a.usefulLifeYears, a.salvageValue));
            return new GetAllAssetsModel(true, 0, "Assets retrieved successfully", responses);
        } catch (error) {
            throw error;
        }
    }

    async deleteAsset(reqModel: DeleteAssetModel, userId?: number): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Asset ID is required");
            }

            const existing = await this.assetInfoRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(0, "Asset not found");
            }

            await transManager.startTransaction();
            await transManager.getRepository(AssetInfoEntity).softDelete(reqModel.id);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 0, "Asset deleted successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getAssetStatistics(reqModel: IdRequestModel): Promise<AssetStatisticsResponseModel> {
        try {
            const companyId = reqModel.id;
            // Allow 0 for all companies
            if (companyId === undefined || companyId === null) {
                throw new ErrorResponse(0, "Company ID is required");
            }

            const statsData = await this.assetInfoRepo.getAssetStatistics(reqModel);
            // Transform to expected format
            const available = parseInt(statsData.find(s => s.status === AssetStatusEnum.AVAILABLE)?.count || '0');
            const inUse = parseInt(statsData.find(s => s.status === AssetStatusEnum.IN_USE)?.count || '0');
            const maintenance = parseInt(statsData.find(s => s.status === AssetStatusEnum.MAINTENANCE)?.count || '0');
            const retired = parseInt(statsData.find(s => s.status === AssetStatusEnum.RETIRED)?.count || '0');
            const total = available + inUse + maintenance + retired;

            const statistics = { total, available, inUse, maintenance, retired };

            return new AssetStatisticsResponseModel(true, 0, "Statistics retrieved successfully", statistics);
        } catch (error) {
            throw error;
        }
    }

    async searchAssets(reqModel: AssetSearchRequestModel): Promise<GetAllAssetsModel> {
        try {
            if (reqModel.companyId === undefined || reqModel.companyId === null) {
                throw new ErrorResponse(0, "Company ID is required");
            }

            const assets = await this.assetInfoRepo.searchAssets(reqModel);
            return new GetAllAssetsModel(true, 0, "Assets retrieved successfully", assets as any);
        } catch (error) {
            throw error;
        }
    }

    async getAssetsWithAssignments(reqModel: IdRequestModel): Promise<GetAssetsWithAssignmentsResponseModel> {
        try {
            const companyId = reqModel.id;
            // Allow 0 for all companies
            if (companyId === undefined || companyId === null) {
                throw new ErrorResponse(0, "Company ID is required");
            }
            const assets = await this.assetInfoRepo.getAssetsWithAssignments(reqModel);
            return new GetAssetsWithAssignmentsResponseModel(true, 0, "Assets with assignments retrieved successfully", assets);
        } catch (error) {
            throw error;
        }
    }


    async createAssignment(reqModel: CreateAssetAssignModel, userId?: number): Promise<GlobalResponse> {
        return new GlobalResponse(false, 400, "Please use the asset operations endpoint for assignment");
    }

    async updateAssignment(reqModel: UpdateAssetAssignModel, userId?: number): Promise<GlobalResponse> {
        return new GlobalResponse(false, 400, "Assignment updates not supported through this endpoint");
    }

    async getAssignment(reqModel: GetAssetAssignModel): Promise<GetAssetAssignByIdModel> {
        const assignment = await this.assignRepo.findOne({ where: { id: reqModel.id } });
        if (!assignment) {
            throw new ErrorResponse(404, "Assignment not found");
        }
        return new GetAssetAssignByIdModel(true, 200, "Assignment retrieved successfully", assignment as any);
    }

    async getAllAssignments(reqModel: IdRequestModel): Promise<GetAllAssetAssignsModel> {
        const assignments = await this.assignRepo.getAllAssignments(reqModel);
        return new GetAllAssetAssignsModel(true, 200, "Assignments retrieved successfully", assignments as any);
    }

    async assignAssetOp(reqModel: AssignAssetOpRequestModel): Promise<GlobalResponse> {
        const { assetId, employeeId, userId, remarks } = reqModel;
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            await transManager.startTransaction();
            const assetRepo = transManager.getRepository(AssetInfoEntity);
            const assignRepo = transManager.getRepository(AssetAssignEntity);

            const asset = await assetRepo.findOne({ where: { id: assetId } });
            if (!asset) throw new NotFoundException('Asset not found');

            const isReassignment = asset.assetStatusEnum === AssetStatusEnum.IN_USE && !!asset.assignedToEmployeeId;

            if (isReassignment) {
                await assignRepo.update(
                    { assetId, isCurrent: true },
                    {
                        isCurrent: false,
                        returnDate: new Date(),
                        returnRemarks: `Reassigned to another employee (ID: ${employeeId})`
                    }
                );
                asset.previousUserEmployeeId = asset.assignedToEmployeeId;
            } else if (asset.assetStatusEnum !== AssetStatusEnum.AVAILABLE) {
                throw new BadRequestException('Asset is not available for assignment');
            }

            asset.assetStatusEnum = AssetStatusEnum.IN_USE;
            asset.assignedToEmployeeId = employeeId;
            asset.userAssignedDate = reqModel.assignedDate ? new Date(reqModel.assignedDate) : new Date();
            await assetRepo.save(asset);

            const assignment = new AssetAssignEntity();
            assignment.assetId = assetId;
            assignment.employeeId = employeeId;
            assignment.assignedDate = reqModel.assignedDate ? new Date(reqModel.assignedDate) : new Date();
            assignment.assignedById = userId;
            assignment.isCurrent = true;
            assignment.remarks = remarks || (isReassignment ? 'Reassigned from previous user' : '');
            await assignRepo.save(assignment);

            await transManager.completeTransaction();
            // Send Emails (Independent of transaction success/failure after commit)
            try {
                // Fetch details for email
                const employee = await this.dataSource.getRepository(EmployeesEntity).findOne({ where: { id: employeeId } });
                const assigner = await this.dataSource.getRepository(AuthUsersEntity).findOne({ where: { id: userId } });

                if (employee && assigner) {
                    const assignedDate = reqModel.assignedDate ? new Date(reqModel.assignedDate) : new Date();
                    const assignedByName = assigner.fullName;

                    const assetDetails = await this.assetInfoRepo.getAssetDetailsForEmail(assetId);
                    const assetType = assetDetails?.assetType || 'Unknown Type';
                    const specification = assetDetails?.specification || 'N/A';
                    const laptopCompany = assetDetails?.laptopCompany || '';
                    const configModel = assetDetails?.model || '';
                    const serialNumber = asset.serialNumber;

                    const brandModelName = (laptopCompany && configModel)
                        ? `${laptopCompany} ${configModel}`.trim()
                        : (laptopCompany || configModel || asset.model || 'Unknown Asset');

                    const assetName = brandModelName;

                    // 1. Send to Assignee (the employee receiving the asset)
                    await this.emailInfoService.sendAssetAssignedEmail(new SendAssetAssignedEmailModel(employee.email, employee.firstName, assetName, assignedByName, assignedDate, assetType, serialNumber, specification, isReassignment, remarks, `${employee.firstName} ${employee.lastName}`.trim(), 'ASSIGNEE'));

                    // 2. Send to the Asset Admin who performed the assignment (if different from assignee)
                    if (assigner.email !== employee.email) {
                        await this.emailInfoService.sendAssetAssignedEmail(new SendAssetAssignedEmailModel(assigner.email, assigner.fullName, assetName, assignedByName, assignedDate, assetType, serialNumber, specification, isReassignment, remarks, `${employee.firstName} ${employee.lastName}`.trim(), 'ADMIN'));
                    }

                    // 3. Send to the Manager of the assigned employee (if exists and not already notified)
                    if (employee.managerId) {
                        const manager = await this.dataSource.getRepository(EmployeesEntity).findOne({ where: { id: employee.managerId } });
                        if (manager && manager.email && manager.email !== assigner.email) {
                            await this.emailInfoService.sendAssetAssignedEmail(new SendAssetAssignedEmailModel(manager.email, manager.firstName, assetName, assignedByName, assignedDate, assetType, serialNumber, specification, isReassignment, remarks, `${employee.firstName} ${employee.lastName}`.trim(), 'MANAGER'));
                        }
                    }
                }
            } catch (emailError) {
                throw emailError;
            }
            // --- PERSISTENT NOTIFICATIONS ---
            try {
                const employee = await this.dataSource.getRepository(EmployeesEntity).findOne({ where: { id: employeeId } });
                const asset = await this.assetInfoRepo.findOne({ where: { id: assetId } });

                if (employee && asset) {
                    const assetDetails = await this.assetInfoRepo.getAssetDetailsForEmail(assetId);
                    const laptopCompany = assetDetails?.laptopCompany || '';
                    const configModel = assetDetails?.model || '';
                    const brandModelName = (laptopCompany && configModel)
                        ? `${laptopCompany} ${configModel}`.trim()
                        : (laptopCompany || configModel || asset.model || 'Unknown Asset');

                    const assetName = `${brandModelName} (SN: ${asset.serialNumber})`;
                    // 1. To Assignee
                    const assigneeUser = await this.dataSource.getRepository(AuthUsersEntity).findOne({ where: { email: employee.email } });
                    if (assigneeUser) {
                        await this.notificationsService.createNotification(assigneeUser.id, { title: 'Asset Assigned', message: `A new asset "${assetName}" has been assigned to you.`, type: NotificationType.SUCCESS, category: 'asset', link: '/self-service', metadata: { assetId: asset.id } });
                    }
                    // 2. To Manager
                    if (employee.managerId) {
                        const manager = await this.dataSource.getRepository(EmployeesEntity).findOne({ where: { id: employee.managerId } });
                        if (manager) {
                            const managerUser = await this.dataSource.getRepository(AuthUsersEntity).findOne({ where: { email: manager.email } });
                            if (managerUser) {
                                await this.notificationsService.createNotification(managerUser.id, { title: 'Asset Assigned to Team Member', message: `Asset "${assetName}" has been assigned to ${employee.firstName} ${employee.lastName}.`, type: NotificationType.INFO, category: 'asset' });
                            }
                        }
                    }
                }
            } catch (notifyError) {
                throw notifyError;
            }
            return new GlobalResponse(true, 200, isReassignment ? 'Asset reassigned successfully' : 'Asset assigned successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async returnAssetOp(reqModel: ReturnAssetOpRequestModel): Promise<GlobalResponse> {
        const { assetId, userId, remarks, targetStatus } = reqModel;
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            await transManager.startTransaction();
            const assetRepo = transManager.getRepository(AssetInfoEntity);

            const asset = await assetRepo.findOne({ where: { id: assetId } });
            if (!asset) throw new NotFoundException('Asset not found');
            const previousUserId = asset.assignedToEmployeeId;
            asset.assetStatusEnum = targetStatus || AssetStatusEnum.AVAILABLE;
            asset.previousUserEmployeeId = asset.assignedToEmployeeId;
            asset.assignedToEmployeeId = null as any;
            asset.userAssignedDate = null as any;
            asset.lastReturnDate = new Date();
            await assetRepo.save(asset);

            if (previousUserId) {
                // Record into Return History Table
                const returnHistory = new AssetReturnHistoryEntity();
                returnHistory.assetId = assetId;
                returnHistory.employeeId = previousUserId;
                returnHistory.returnDate = new Date();
                returnHistory.returnReason = remarks || 'Action from Manage Asset';
                returnHistory.assetCondition = 'Good'; // Default condition since modal doesn't capture it yet
                returnHistory.remarks = remarks || '';
                returnHistory.userId = userId;
                returnHistory.companyId = asset.companyId;
                returnHistory.allocationDate = asset.userAssignedDate;
                await transManager.getRepository(AssetReturnHistoryEntity).save(returnHistory);
                // Update assignment table where return date is null
                await transManager.getRepository(AssetAssignEntity).update({ assetId: assetId, employeeId: previousUserId, returnDate: IsNull() as any }, { returnDate: new Date(), remarks: `Returned: ${remarks || 'No reason specified'}` });
            }
            await transManager.completeTransaction();
            // --- PERSISTENT NOTIFICATIONS ---
            try {
                if (previousUserId) {
                    const employee = await this.dataSource.getRepository(EmployeesEntity).findOne({ where: { id: previousUserId } });
                    if (employee) {
                        const user = await this.dataSource.getRepository(AuthUsersEntity).findOne({ where: { email: employee.email } });
                        if (user) {
                            await this.notificationsService.createNotification(user.id, { title: 'Asset Returned', message: `Your asset "${asset.model} (SN: ${asset.serialNumber})" has been marked as returned.`, type: NotificationType.INFO, category: 'asset' });
                        }
                    }
                }
            } catch (notifyError) {
                throw notifyError;
            }

            return new GlobalResponse(true, 200, 'Asset returned successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getExpiringWarranty(reqModel: GetExpiringWarrantyRequestModel): Promise<GetAllAssetsModel> {
        const { companyId, months } = reqModel;
        const dateLimit = new Date();
        dateLimit.setMonth(dateLimit.getMonth() + (months || 3));

        const assets = await this.assetInfoRepo.find({
            where: { companyId, warrantyExpiry: LessThan(dateLimit) }
        });
        const responses = assets.map(a => new AssetResponseModel(a.id, a.companyId, a.deviceId, a.serialNumber, a.assetStatusEnum, a.createdAt, a.updatedAt, a.purchaseDate, a.warrantyExpiry, a.deviceConfigId, a.model, a.configuration, a.assignedToEmployeeId, a.previousUserEmployeeId, a.userAssignedDate, a.lastReturnDate, a.boxNo, a.complianceStatus, a.lastSync, a.encryptionStatus, a.batteryLevel, a.storageAvailable, a.purchaseCost, a.currentValue, a.depreciationMethod, a.usefulLifeYears, a.salvageValue));
        return new GetAllAssetsModel(true, 200, 'Expiring assets retrieved', responses);
    }

    /**
     * Calculate current value of an asset based on depreciation
     * Updates the currentValue field in the database
     * 
     * @param assetId - ID of the asset to calculate for
     */
    async calculateDepreciation(assetId: number): Promise<number> {
        const asset = await this.assetInfoRepo.findOne({ where: { id: assetId } });
        if (!asset || !asset.purchaseDate || !asset.purchaseCost) return 0;

        const now = new Date();
        const purchaseDate = new Date(asset.purchaseDate);
        const ageInYears = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

        let newValue = Number(asset.purchaseCost);
        const salvageValue = Number(asset.salvageValue || 0);
        const lifeYears = Number(asset.usefulLifeYears || 5);

        if (asset.depreciationMethod === 'STRAIGHT_LINE') {
            const annualDepreciation = (newValue - salvageValue) / lifeYears;
            newValue = newValue - (annualDepreciation * ageInYears);
        } else if (asset.depreciationMethod === 'DECLINING') {
            const rate = 0.2; // 20% declining rate
            newValue = newValue * Math.pow((1 - rate), ageInYears);
        }

        newValue = Math.max(newValue, salvageValue);

        asset.currentValue = Number(newValue.toFixed(2));
        await this.assetInfoRepo.save(asset);
        return asset.currentValue;
    }
}
