import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { CreatePOModel, UpdatePOModel, PurchaseOrderModel, POItemModel, GetAllPOsModel, GetPOByIdModel, POStatusEnum, GetPORequestModel, UpdatePOStatusRequestModel, GetAllPOsCompanyIdRequestModel } from '@bosvault/shared-models';
import { GlobalResponse, ErrorResponse } from '@bosvault/backend-utils';
import { PurchaseOrderEntity } from './entities/purchase-order.entity';
import { PurchaseOrderItemEntity } from './entities/purchase-order-item.entity';
import { GenericTransactionManager } from '../../../database/typeorm-transactions';
import { PurchaseOrderRepository } from './repositories/purchase-order.repository';
import { PurchaseOrderItemRepository } from './repositories/purchase-order-item.repository';
import { EmployeesRepository } from '../employees/repositories/employees.repository';
import { VendorsMasterEntity } from '../masters/vendor/entities/vendor.entity';
import { AuthUsersEntity } from '../auth-users/entities/auth-users.entity';
import { CompanyInfoEntity } from '../masters/company-info/entities/company-info.entity';
import { AssetTypeMasterEntity } from '../masters/asset-type/entities/asset-type.entity';
import { SendPOApprovalEmailModel } from '@bosvault/shared-models';
import { EmailInfoService } from '../email/email-info.service';
import { VendorRepository } from '../masters/vendor/repositories/vendor.repository';

@Injectable()
export class ProcurementService {
    private readonly uploadPath = path.resolve(__dirname, '../../../../../../uploads/procurement');

    constructor(
        private dataSource: DataSource,
        private poRepo: PurchaseOrderRepository,
        private poItemRepo: PurchaseOrderItemRepository,
        private employeeRepo: EmployeesRepository,
        @Inject(forwardRef(() => EmailInfoService))
        private emailInfoService: EmailInfoService,
        private vendorRepo: VendorRepository,
    ) {
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async createPurchaseOrder(reqModel: CreatePOModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const { userId, username, companyId, vendorId, approverIds, orderDate, items, notes, timeSpentMinutes, expectedDeliveryDate, invoiceUrl, currency, vendorName } = reqModel;
            const requesterAuthUser = await this.dataSource.getRepository(AuthUsersEntity).findOne({ where: { id: userId } });
            if (!requesterAuthUser) {
                throw new ErrorResponse(404, 'User profile not found for current session');
            }

            await transManager.startTransaction();
            const poNumber = `PO-${Date.now()}`;
            const totalAmount = (items || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

            const poEntity = new PurchaseOrderEntity();
            poEntity.userId = userId;
            poEntity.userName = username;
            poEntity.companyId = companyId;
            poEntity.poNumber = poNumber;
            poEntity.vendorId = vendorId;
            poEntity.requesterId = userId;
            poEntity.approverIds = approverIds;
            poEntity.orderDate = orderDate;
            poEntity.expectedDeliveryDate = expectedDeliveryDate;
            poEntity.status = POStatusEnum.ORDERED;
            poEntity.totalAmount = totalAmount;
            poEntity.notes = notes;
            poEntity.timeSpentMinutes = timeSpentMinutes;
            poEntity.invoiceUrl = invoiceUrl;
            poEntity.currency = currency;
            poEntity.vendorName = vendorName;

            const savedPO = await transManager.getRepository(PurchaseOrderEntity).save(poEntity);
            const itemEntities = items.map(i => {
                const item = new PurchaseOrderItemEntity();
                item.userId = userId;
                item.userName = username;
                item.companyId = companyId;
                item.itemName = i.itemName;
                item.quantity = i.quantity;
                item.unitPrice = i.unitPrice;
                item.purchaseOrderId = savedPO.id;
                item.assetTypeId = i.assetTypeId;
                item.assetTypeName = i.assetTypeName;
                return item;
            });
            await transManager.getRepository(PurchaseOrderItemEntity).save(itemEntities);
            await transManager.completeTransaction();

            // Send email to approvers if present
            if (savedPO.approverIds && savedPO.approverIds.length > 0) {
                const approverEmployees = await this.employeeRepo.find({ where: { id: In(savedPO.approverIds) } });
                const vendor = await this.vendorRepo.findOne({ where: { id: savedPO.vendorId } });
                
                const recipientEmails = approverEmployees.map(e => e.email).filter(Boolean) as string[];
                const recipientNames = approverEmployees.map(e => `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email);
                
                if (recipientEmails.length > 0) {
                    await this.emailInfoService.sendPOApprovalEmail(new SendPOApprovalEmailModel(
                        recipientEmails,
                        recipientNames,
                        savedPO.poNumber,
                        username,
                        totalAmount,
                        vendor?.name || '',
                        savedPO.id
                    ));
                }
            }

            // Send email to requester as acknowledgement
            if (requesterAuthUser && requesterAuthUser.email) {
                const vendor = await this.vendorRepo.findOne({ where: { id: savedPO.vendorId } });
                await this.emailInfoService.sendPOApprovalEmail(new SendPOApprovalEmailModel(
                    [requesterAuthUser.email],
                    [username],
                    savedPO.poNumber,
                    username,
                    totalAmount,
                    vendor?.name || '',
                    savedPO.id
                ));
            }

            return new GlobalResponse(true, 201, 'Purchase Order created successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async updatePurchaseOrder(reqModel: UpdatePOModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const { id, userId, username, companyId, items, vendorId, approverIds, orderDate, expectedDeliveryDate, notes, timeSpentMinutes, invoiceUrl, currency, vendorName } = reqModel;
            const employee = await this.employeeRepo.findOne({ where: { userId: userId } });
            if (!employee) {
                throw new ErrorResponse(404, 'Employee profile not found for current user');
            }

            const existingPO = await this.poRepo.findOne({ where: { id: id } });
            if (!existingPO) {
                throw new ErrorResponse(404, 'Purchase Order not found');
            }

            if (existingPO.status === POStatusEnum.APPROVED) {
                const dbItems = await this.poItemRepo.find({ where: { purchaseOrderId: existingPO.id } });
                const itemsChanged = (items || []).length !== dbItems.length || (items || []).some((item, index) => {
                    const dbItem = dbItems[index];
                    return !dbItem ||
                        dbItem.itemName !== item.itemName ||
                        Number(dbItem.quantity) !== Number(item.quantity) ||
                        Number(dbItem.unitPrice) !== Number(item.unitPrice) ||
                        Number(dbItem.assetTypeId || 0) !== Number(item.assetTypeId || 0) ||
                        (dbItem.assetTypeName || '') !== (item.assetTypeName || '');
                });

                const existingDeliveryTime = existingPO.expectedDeliveryDate ? new Date(existingPO.expectedDeliveryDate).getTime() : null;
                const newDeliveryTime = expectedDeliveryDate ? new Date(expectedDeliveryDate).getTime() : null;
                const deliveryDateChanged = existingDeliveryTime !== newDeliveryTime;

                const existingOrderTime = existingPO.orderDate ? new Date(existingPO.orderDate).getTime() : null;
                const newOrderTime = orderDate ? new Date(orderDate).getTime() : null;
                const orderDateChanged = existingOrderTime !== newOrderTime;

                const otherFieldsChanged =
                    Number(existingPO.vendorId) !== Number(vendorId) ||
                    Number(existingPO.companyId) !== Number(companyId) ||
                    (existingPO.approverIds || []).join(',') !== (approverIds || []).join(',') ||
                    orderDateChanged ||
                    deliveryDateChanged ||
                    (existingPO.notes || '') !== (notes || '') ||
                    existingPO.currency !== currency ||
                    (existingPO.vendorName || '') !== (vendorName || '');

                if (itemsChanged || otherFieldsChanged) {
                    throw new ErrorResponse(400, 'Approved Purchase Order cannot be edited');
                }
            }

            await transManager.startTransaction();
            const transRepo = transManager.getRepository(PurchaseOrderEntity);
            const itemRepo = transManager.getRepository(PurchaseOrderItemEntity);

            const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

            existingPO.vendorId = vendorId;
            existingPO.companyId = companyId || existingPO.companyId;
            existingPO.approverIds = approverIds || existingPO.approverIds;
            existingPO.orderDate = orderDate ? new Date(orderDate) : existingPO.orderDate;
            existingPO.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
            existingPO.totalAmount = totalAmount;
            existingPO.notes = notes;
            existingPO.timeSpentMinutes = timeSpentMinutes;
            existingPO.invoiceUrl = invoiceUrl || existingPO.invoiceUrl;
            existingPO.currency = currency || existingPO.currency;
            existingPO.vendorName = vendorName;

            await transRepo.save(existingPO);

            // Replace items entirely
            await itemRepo.delete({ purchaseOrderId: existingPO.id });
            const itemEntities = items.map(i => {
                const item = new PurchaseOrderItemEntity();
                item.purchaseOrderId = existingPO.id;
                item.userId = userId;
                item.userName = username;
                item.companyId = companyId;
                item.itemName = i.itemName;
                item.quantity = i.quantity;
                item.unitPrice = i.unitPrice;
                item.assetTypeId = i.assetTypeId;
                item.assetTypeName = i.assetTypeName;
                return item;
            });
            await itemRepo.save(itemEntities);
            await transManager.completeTransaction();

            return new GlobalResponse(true, 200, 'Purchase Order updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error
        }
    }

    async getAllPurchaseOrders(): Promise<GetAllPOsModel> {
        try {
            const pos = await this.poRepo.find({ order: { createdAt: 'DESC' } });
            const responses = await this.mapPOEntitiesToModels(pos);
            return new GetAllPOsModel(true, 200, 'Purchase Orders retrieved successfully', responses);
        } catch (error) {
            throw error;
        }
    }

    async getPurchaseOrderByCompanyId(reqModel: GetAllPOsCompanyIdRequestModel): Promise<GetAllPOsModel> {
        try {
            const pos = await this.poRepo.find({ where: { companyId: reqModel.companyId }, order: { createdAt: 'DESC' } });
            const responses = await this.mapPOEntitiesToModels(pos);
            return new GetAllPOsModel(true, 200, 'Purchase Orders retrieved successfully', responses);
        } catch (error) {
            throw error;
        }
    }

    private async mapPOEntitiesToModels(pos: PurchaseOrderEntity[]): Promise<PurchaseOrderModel[]> {
        if (pos.length === 0) return [];

        const poIds: number[] = [];
        const userIds = new Set<number>();
        const companyIds = new Set<number>();
        const vendorIds = new Set<number>();
        const approverEmpIds = new Set<number>();

        for (const po of pos) {
            poIds.push(po.id);
            if (po.requesterId) userIds.add(Number(po.requesterId));
            if (po.userId) userIds.add(Number(po.userId));
            if (po.companyId) companyIds.add(Number(po.companyId));
            if (po.vendorId) vendorIds.add(Number(po.vendorId));
            po.approverIds && po.approverIds.forEach(id => approverEmpIds.add(Number(id)));
        }

        const [allItems, authUsers, approverEmployees, vendors, companyInfos] = await Promise.all([
            this.poItemRepo.find({ where: { purchaseOrderId: In(poIds) } }),
            this.dataSource.getRepository(AuthUsersEntity).find({ where: { id: In([...userIds]) } }),
            this.employeeRepo.find({ where: { id: In([...approverEmpIds]) } }),
            this.dataSource.getRepository(VendorsMasterEntity).find({ where: { id: In([...vendorIds]) } }),
            this.dataSource.getRepository(CompanyInfoEntity).find({ where: { id: In([...companyIds]) } })
        ]);

        const itemsByPo = new Map<number, PurchaseOrderItemEntity[]>();
        const assetTypeIds = new Set<number>();
        for (const item of allItems) {
            const poId = Number(item.purchaseOrderId);
            if (!itemsByPo.has(poId)) itemsByPo.set(poId, []);
            itemsByPo.get(poId).push(item);
            if (item.assetTypeId) assetTypeIds.add(Number(item.assetTypeId));
        }

        const assetTypeMap = new Map<number, string>();
        if (assetTypeIds.size > 0) {
            const assetTypeInfos = await this.dataSource.getRepository(AssetTypeMasterEntity).find({ where: { id: In([...assetTypeIds]) } });
            for (const at of assetTypeInfos) assetTypeMap.set(Number(at.id), at.name);
        }

        const userMap = new Map(authUsers.map(u => [Number(u.id), u.fullName]));
        const employeeMap = new Map(approverEmployees.map(e => [Number(e.id), `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email]));
        const vendorMap = new Map(vendors.map(v => [Number(v.id), v.name]));
        const companyMap = new Map(companyInfos.map(c => [Number(c.id), c.companyName]));

        const responses: PurchaseOrderModel[] = [];
        for (const p of pos) {
            const items = itemsByPo.get(Number(p.id)) || [];
            const poItems = items.map(i => new POItemModel(
                i.itemName, i.quantity, i.unitPrice, i.assetTypeId,
                i.assetTypeName || (i.assetTypeId ? assetTypeMap.get(Number(i.assetTypeId)) : undefined)
            ));

            responses.push(new PurchaseOrderModel(
                p.id, p.poNumber, p.vendorId, p.requesterId, p.orderDate, p.status, p.totalAmount, p.createdAt,
                poItems, p.vendorName || vendorMap.get(Number(p.vendorId)), userMap.get(Number(p.requesterId)) || userMap.get(Number(p.userId)),
                p.expectedDeliveryDate, p.notes, p.timeSpentMinutes, p.approverIds,
                p.approverIds?.map(id => employeeMap.get(Number(id)) || '').filter(Boolean), companyMap.get(Number(p.companyId)), p.invoiceUrl, p.currency
            ));
        }
        return responses;
    }

    async getPurchaseOrderById(reqModel: GetPORequestModel): Promise<GetPOByIdModel> {
        try {
            const p = await this.poRepo.findOne({ where: { id: reqModel.id } });
            if (!p) {
                throw new ErrorResponse(404, 'Purchase Order not found');
            }

            const [items, user, requester, approver, vendor, company] = await Promise.all([
                this.poItemRepo.find({ where: { purchaseOrderId: p.id } }),
                p.userId ? this.dataSource.getRepository(AuthUsersEntity).findOne({ where: { id: p.userId } }) : null,
                p.requesterId ? this.dataSource.getRepository(AuthUsersEntity).findOne({ where: { id: p.requesterId } }) : null,
                p.approverIds && p.approverIds.length > 0 ? this.employeeRepo.find({ where: { id: In(p.approverIds) } }) : [],
                p.vendorId ? this.dataSource.getRepository(VendorsMasterEntity).findOne({ where: { id: p.vendorId } }) : null,
                p.companyId ? this.dataSource.getRepository(CompanyInfoEntity).findOne({ where: { id: Number(p.companyId) } }) : null
            ]);

            const assetTypeMap = new Map<number, string>();
            const assetTypeIds = [...new Set(items.map(i => Number(i.assetTypeId)).filter(id => id > 0))];
            if (assetTypeIds.length > 0) {
                const assetTypes = await this.dataSource.getRepository(AssetTypeMasterEntity).find({ where: { id: In(assetTypeIds) } });
                for (const at of assetTypes) assetTypeMap.set(Number(at.id), at.name);
            }

            const poItems: POItemModel[] = [];
            for (const i of items) {
                poItems.push(new POItemModel(
                    i.itemName, i.quantity, i.unitPrice, i.assetTypeId,
                    i.assetTypeName || (i.assetTypeId ? assetTypeMap.get(Number(i.assetTypeId)) : undefined)
                ));
            }

            const requesterName = requester?.fullName || user?.fullName;
            const approverNames = (approver as any[] | null)?.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email).filter(Boolean) as string[] | undefined;

            const response = new PurchaseOrderModel(p.id, p.poNumber, p.vendorId, p.requesterId, p.orderDate, p.status, p.totalAmount, p.createdAt, poItems, p.vendorName || vendor?.name, requesterName, p.expectedDeliveryDate, p.notes, p.timeSpentMinutes, p.approverIds, approverNames, company?.companyName, p.invoiceUrl, p.currency);
            return new GetPOByIdModel(true, 200, 'Purchase Order retrieved successfully', response);
        } catch (error) {
            throw error;
        }
    }

    async updatePOStatus(reqModel: UpdatePOStatusRequestModel): Promise<GlobalResponse> {
        try {
            await this.poRepo.update(reqModel.id, { status: reqModel.status });
            return new GlobalResponse(true, 200, 'Purchase Order status updated successfully');
        } catch (error) {
            throw error;
        }
    }

    async deletePurchaseOrder(id: number): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existingPO = await this.poRepo.findOne({ where: { id: id } });
            if (!existingPO) {
                throw new ErrorResponse(404, 'Purchase Order not found');
            }
            if (existingPO.status === POStatusEnum.APPROVED) {
                throw new ErrorResponse(400, 'Approved Purchase Order cannot be deleted');
            }

            await transManager.startTransaction();
            const poItemRepo = transManager.getRepository(PurchaseOrderItemEntity);
            const poRepo = transManager.getRepository(PurchaseOrderEntity);

            await poItemRepo.delete({ purchaseOrderId: id });
            await poRepo.delete(id);

            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Purchase Order deleted successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async uploadDocument(file: Express.Multer.File): Promise<GlobalResponse> {
        try {
            if (!file) {
                throw new ErrorResponse(400, 'No file uploaded');
            }

            const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const fileName = `${Date.now()}-${sanitizedOriginalName}`;
            const filePath = path.join(this.uploadPath, fileName);

            fs.writeFileSync(filePath, file.buffer);

            const fileUrl = `/api/procurement/document/${fileName}`;

            return new GlobalResponse(true, 201, 'Document uploaded successfully', {
                name: file.originalname,
                url: fileUrl,
                type: file.mimetype,
                size: file.size,
                fileName: fileName
            });
        } catch (error) {
            throw error instanceof ErrorResponse ? error : new ErrorResponse(500, 'Failed to upload document');
        }
    }

    getDocument(filename: string): string {
        const filePath = path.join(this.uploadPath, filename);
        if (!fs.existsSync(filePath)) {
            throw new ErrorResponse(404, 'File not found');
        }
        return filePath;
    }
}
