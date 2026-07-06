import { POStatusEnum } from '../enums';
import { GlobalResponse } from '../common/global-response';
import { CommonRequestModel } from '../common/common-models';

export class CreatePOModel extends CommonRequestModel {
    vendorId: number;
    orderDate: Date;
    expectedDeliveryDate?: Date;
    items: POItemModel[];
    notes?: string;
    timeSpentMinutes?: number;
    approverIds?: number[];
    invoiceUrl?: string;
    currency?: string;
    vendorName?: string;

    constructor(
        username: string,
        userId: number,
        ipAddress: string,
        companyId: number,
        vendorId: number,
        orderDate: Date,
        items: POItemModel[],
        expectedDeliveryDate?: Date,
        notes?: string,
        timeSpentMinutes?: number,
        approverIds?: number[],
        invoiceUrl?: string,
        currency?: string,
        vendorName?: string
    ) {
        super(username, userId, ipAddress, companyId);
        this.vendorId = vendorId;
        this.orderDate = orderDate;
        this.items = items;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.notes = notes;
        this.timeSpentMinutes = timeSpentMinutes;
        this.approverIds = approverIds;
        this.invoiceUrl = invoiceUrl;
        this.currency = currency || 'USD';
        this.vendorName = vendorName;
    }
}

export class POItemModel {
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    assetTypeId?: number;
    assetTypeName?: string;

    constructor(
        itemName: string,
        quantity: number,
        unitPrice: number,
        assetTypeId?: number,
        assetTypeName?: string
    ) {
        this.itemName = itemName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = quantity * unitPrice;
        this.assetTypeId = assetTypeId;
        this.assetTypeName = assetTypeName;
    }
}

export class UpdatePOModel extends CreatePOModel {
    id: number;

    constructor(
        id: number,
        username: string,
        userId: number,
        ipAddress: string,
        companyId: number,
        vendorId: number,
        orderDate: Date,
        items: POItemModel[],
        expectedDeliveryDate?: Date,
        notes?: string,
        timeSpentMinutes?: number,
        approverIds?: number[],
        invoiceUrl?: string,
        currency?: string,
        vendorName?: string,
    ) {
        super(username, userId, ipAddress, companyId, vendorId, orderDate, items, expectedDeliveryDate, notes, timeSpentMinutes, approverIds, invoiceUrl, currency, vendorName);
        this.id = id;
    }
}


export class GetAllPOsCompanyIdRequestModel {
    companyId: number;

    constructor(companyId: number) {
        this.companyId = companyId;
    }
}

export class GetPORequestModel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}


export class UpdatePOStatusRequestModel {
    id: number;
    status: POStatusEnum;

    constructor(id: number, status: POStatusEnum) {
        this.id = id;
        this.status = status;
    }
}


export class PurchaseOrderModel {
    id: number;
    poNumber: string;
    vendorId: number;
    vendorName?: string;
    requesterId: number;
    requesterName?: string;
    orderDate: Date;
    expectedDeliveryDate?: Date;
    status: POStatusEnum;
    totalAmount: number;
    items?: POItemModel[];
    notes?: string;
    timeSpentMinutes?: number;
    createdAt: Date;
    approverIds?: number[];
    approverNames?: string[];
    companyName?: string;
    invoiceUrl?: string;
    currency?: string;

    constructor(
        id: number,
        poNumber: string,
        vendorId: number,
        requesterId: number,
        orderDate: Date,
        status: POStatusEnum,
        totalAmount: number,
        createdAt: Date,
        items?: POItemModel[],
        vendorName?: string,
        requesterName?: string,
        expectedDeliveryDate?: Date,
        notes?: string,
        timeSpentMinutes?: number,
        approverIds?: number[],
        approverNames?: string[],
        companyName?: string,
        invoiceUrl?: string,
        currency?: string
    ) {
        this.id = id;
        this.poNumber = poNumber;
        this.vendorId = vendorId;
        this.requesterId = requesterId;
        this.orderDate = orderDate;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.items = items;
        this.vendorName = vendorName;
        this.requesterName = requesterName;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.notes = notes;
        this.timeSpentMinutes = timeSpentMinutes;
        this.approverIds = approverIds;
        this.approverNames = approverNames;
        this.companyName = companyName;
        this.invoiceUrl = invoiceUrl;
        this.currency = currency || 'USD';
    }
}


export class GetAllPOsModel extends GlobalResponse {
    pos: PurchaseOrderModel[];

    constructor(status: boolean, code: number, message: string, pos: PurchaseOrderModel[]) {
        super(status, code, message);
        this.pos = pos;
    }
}

export class GetPOByIdModel extends GlobalResponse {
    po: PurchaseOrderModel;

    constructor(status: boolean, code: number, message: string, po: PurchaseOrderModel) {
        super(status, code, message);
        this.po = po;
    }
}
