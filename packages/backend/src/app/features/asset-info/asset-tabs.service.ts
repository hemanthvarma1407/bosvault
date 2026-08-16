import { Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { AssetInfoRepository } from './repositories/asset-info.repository';
import { AssetReturnHistoryRepository } from './repositories/asset-return-history.repository';
import { AssetNextAssignmentRepository } from './repositories/asset-next-assignment.repository';
import { AssetReturnHistoryEntity } from './entities/asset-return-history.entity';
import { AssetNextAssignmentEntity } from './entities/asset-next-assignment.entity';
import { AssetAssignEntity } from './entities/asset-assign.entity';
import { AssetInfoEntity } from './entities/asset-info.entity';
import { GetStoreAssetsRequestModel, GetStoreAssetsResponseModel, StoreAssetModel, GetReturnAssetsRequestModel, GetReturnAssetsResponseModel, ReturnAssetModel, ProcessReturnRequestModel, ProcessReturnResponseModel, GetNextAssignmentsRequestModel, GetNextAssignmentsResponseModel, NextAssignmentModel, CreateNextAssignmentRequestModel, CreateNextAssignmentResponseModel, AssignFromQueueRequestModel, AssignFromQueueResponseModel, AssetStatusEnum, NextAssignmentStatus, AssignmentPriority, NextAssignmentStatusEnum, AssignmentPriorityEnum } from '@bosvault/shared-models';
import { GenericTransactionManager } from '../../../database/typeorm-transactions';
import { ErrorResponse } from '@bosvault/backend-utils';

@Injectable()
export class AssetTabsService {
    constructor(
        private dataSource: DataSource,
        private assetInfoRepo: AssetInfoRepository,
        private returnHistoryRepo: AssetReturnHistoryRepository,
        private nextAssignmentRepo: AssetNextAssignmentRepository
    ) { }

    async getStoreAssets(reqModel: GetStoreAssetsRequestModel): Promise<GetStoreAssetsResponseModel> {
        try {
            const results = await this.assetInfoRepo.getStoreAssets({ id: reqModel.companyId });
            const assets: StoreAssetModel[] = results.map(r => ({ id: r.id, deviceName: r.deviceName, configuration: r.configuration, serialNumber: r.serialNumber, boxNo: r.boxNo, pastUserName: r.pastUserName, presentUserName: r.presentUserName, assetStatusEnum: r.assetStatusEnum, brandName: r.brandName, model: r.model, warrantyExpiry: r.warrantyExpiry }));
            return new GetStoreAssetsResponseModel(true, 200, 'Store assets retrieved successfully', assets);
        } catch (error) {
            throw error;
        }
    }

    async getReturnAssets(reqModel: GetReturnAssetsRequestModel): Promise<GetReturnAssetsResponseModel> {
        try {
            const results = await this.returnHistoryRepo.getReturnAssets(reqModel);
            const returns: ReturnAssetModel[] = results.map(r => ({ id: r.id, employeeName: r.employeeName, employeeRole: r.employeeRole, laptopAllocationStatus: r.deviceType === 'Laptop' ? 'Returned' : undefined, desktopAllocationStatus: r.deviceType === 'Desktop' ? 'Returned' : undefined, configuration: r.configuration, allocationDate: r.allocationDate, returnDate: r.returnDate, returnReason: r.returnReason, assetCondition: r.assetCondition, assetId: r.assetId, serialNumber: r.serialNumber }));
            return new GetReturnAssetsResponseModel(true, 200, 'Return assets retrieved successfully', returns);
        } catch (error) {
            throw error;
        }
    }

    async processReturn(reqModel: ProcessReturnRequestModel): Promise<ProcessReturnResponseModel> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const asset = await this.assetInfoRepo.findOne({ where: { id: reqModel.assetId } });
            if (!asset) {
                throw new ErrorResponse(404, 'Asset not found');
            }

            await transManager.startTransaction();

            // 1. Create return history record
            const returnHistory = new AssetReturnHistoryEntity();
            returnHistory.assetId = reqModel.assetId;
            returnHistory.employeeId = reqModel.employeeId;
            returnHistory.returnDate = reqModel.returnDate ? new Date(reqModel.returnDate) : new Date();
            returnHistory.returnReason = reqModel.returnReason || '';
            returnHistory.assetCondition = reqModel.assetCondition || '';
            returnHistory.remarks = reqModel.remarks || '';
            returnHistory.userId = reqModel.userId;
            returnHistory.companyId = asset.companyId;
            returnHistory.allocationDate = asset.userAssignedDate;
            const savedReturn = await transManager.getRepository(AssetReturnHistoryEntity).save(returnHistory);

            // 2. Update active assignment in asset_assign table
            await transManager.getRepository(AssetAssignEntity).update({ assetId: reqModel.assetId, employeeId: reqModel.employeeId, returnDate: IsNull() }, { returnDate: returnHistory.returnDate, remarks: `Returned: ${reqModel.returnReason || 'No reason specified'}` });

            // 3. Update asset status to available
            await transManager.getRepository(AssetInfoEntity).update(reqModel.assetId, { assetStatusEnum: AssetStatusEnum.AVAILABLE, previousUserEmployeeId: reqModel.employeeId, assignedToEmployeeId: null as any, lastReturnDate: returnHistory.returnDate, userAssignedDate: null as any });

            await transManager.completeTransaction();

            const returnRecord: ReturnAssetModel = { id: savedReturn.id, employeeName: '', returnDate: savedReturn.returnDate, returnReason: savedReturn.returnReason, assetCondition: savedReturn.assetCondition, assetId: savedReturn.assetId, allocationDate: savedReturn.allocationDate || undefined };
            return new ProcessReturnResponseModel(true, 201, 'Asset return processed successfully', returnRecord);
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getNextAssignments(reqModel: GetNextAssignmentsRequestModel): Promise<GetNextAssignmentsResponseModel> {
        try {
            const results = await this.nextAssignmentRepo.getNextAssignments(reqModel);
            const assignments: NextAssignmentModel[] = results.map(r => ({ id: r.id, employeeName: r.employeeName, employeeRole: r.employeeRole, laptopAllocationStatus: r.assetType === 'Laptop' ? r.status : undefined, desktopAllocationStatus: r.assetType === 'Desktop' ? r.status : undefined, assetType: r.assetType, requestDate: r.requestDate, expectedDate: r.expectedDate, assignedAssetId: r.assignedAssetId, assignedAssetName: r.assignedAssetName, status: r.status, priority: r.priority, remarks: r.remarks }));
            return new GetNextAssignmentsResponseModel(true, 200, 'Next assignments retrieved successfully', assignments);
        } catch (error) {
            throw error;
        }
    }

    async createNextAssignment(reqModel: CreateNextAssignmentRequestModel): Promise<CreateNextAssignmentResponseModel> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            await transManager.startTransaction();
            const assignment = new AssetNextAssignmentEntity();
            assignment.employeeId = reqModel.employeeId;
            assignment.assetType = reqModel.assetType;
            assignment.requestDate = new Date(reqModel.requestDate);
            assignment.expectedDate = reqModel.expectedDate ? new Date(reqModel.expectedDate) : null as any;
            assignment.priority = (reqModel.priority as any) || AssignmentPriorityEnum.MEDIUM;
            assignment.remarks = reqModel.remarks || '';
            assignment.status = NextAssignmentStatusEnum.PENDING;
            assignment.userId = reqModel.userId;
            assignment.requestedById = reqModel.userId;
            const saved = await transManager.getRepository(AssetNextAssignmentEntity).save(assignment);
            await transManager.completeTransaction();
            const assignmentModel: NextAssignmentModel = { id: saved.id, employeeName: '', assetType: saved.assetType, requestDate: saved.requestDate, expectedDate: saved.expectedDate, status: saved.status as any as NextAssignmentStatus, priority: saved.priority as any as AssignmentPriority, remarks: saved.remarks };
            return new CreateNextAssignmentResponseModel(true, 201, 'Assignment request created successfully', assignmentModel);
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async assignFromQueue(reqModel: AssignFromQueueRequestModel): Promise<AssignFromQueueResponseModel> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const assignment = await this.nextAssignmentRepo.findOne({ where: { id: reqModel.queueId } });
            if (!assignment) {
                throw new ErrorResponse(404, 'Assignment request not found');
            }

            const asset = await this.assetInfoRepo.findOne({ where: { id: reqModel.assetId } });
            if (!asset) {
                throw new ErrorResponse(404, 'Asset not found');
            }

            await transManager.startTransaction();

            // 1. Update queue request status
            await transManager.getRepository(AssetNextAssignmentEntity).update(reqModel.queueId, {
                assignedAssetId: reqModel.assetId,
                status: NextAssignmentStatusEnum.ASSIGNED
            });

            // 2. Create historical assignment record
            const newAssign = new AssetAssignEntity();
            newAssign.assetId = reqModel.assetId;
            newAssign.employeeId = assignment.employeeId;
            newAssign.assignedById = reqModel.userId;
            newAssign.assignedDate = new Date();
            newAssign.companyId = asset.companyId;
            newAssign.userId = assignment.employeeId;
            await transManager.getRepository(AssetAssignEntity).save(newAssign);

            // 3. Update asset current status
            await transManager.getRepository(AssetInfoEntity).update(reqModel.assetId, { assignedToEmployeeId: assignment.employeeId, assetStatusEnum: AssetStatusEnum.IN_USE, userAssignedDate: newAssign.assignedDate });

            await transManager.completeTransaction();
            const assignmentModel: NextAssignmentModel = { id: assignment.id, employeeName: '', assetType: assignment.assetType, requestDate: assignment.requestDate, assignedAssetId: reqModel.assetId, status: NextAssignmentStatusEnum.ASSIGNED as any as NextAssignmentStatus, priority: assignment.priority as any as AssignmentPriority };
            return new AssignFromQueueResponseModel(true, 200, 'Asset assigned successfully', assignmentModel);
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
