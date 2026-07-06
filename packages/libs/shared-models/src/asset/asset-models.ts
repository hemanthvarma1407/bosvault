import { GlobalResponse } from '../common/global-response';
import { AssetStatusEnum, ComplianceStatusEnum, EncryptionStatusEnum } from '../enums';

export class CreateAssetModel {
    companyId: number;
    deviceId: number;
    deviceConfigId?: number;
    model?: string;
    serialNumber: string;
    boxNo?: string;
    configuration?: string;
    assignedToEmployeeId?: number;
    previousUserEmployeeId?: number;
    purchaseDate?: string;
    warrantyExpiry?: string;
    assetStatusEnum: AssetStatusEnum;
    userAssignedDate?: string;
    lastReturnDate?: string;
    complianceStatus?: ComplianceStatusEnum;
    lastSync?: string;
    encryptionStatus?: EncryptionStatusEnum;
    batteryLevel?: number;
    storageAvailable?: string;
    purchaseCost?: number;
    currentValue?: number;
    depreciationMethod?: string;
    usefulLifeYears?: number;
    salvageValue?: number;

    constructor(
        companyId: number,
        deviceId: number,
        serialNumber: string,
        assetStatusEnum: AssetStatusEnum,
        purchaseDate?: string,
        warrantyExpiry?: string,
        deviceConfigId?: number,
        model?: string,
        configuration?: string,
        assignedToEmployeeId?: number,
        previousUserEmployeeId?: number,
        userAssignedDate?: string,
        lastReturnDate?: string,
        boxNo?: string,
        complianceStatus?: ComplianceStatusEnum,
        lastSync?: string,
        encryptionStatus?: EncryptionStatusEnum,
        batteryLevel?: number,
        storageAvailable?: string,
        purchaseCost?: number,
        currentValue?: number,
        depreciationMethod?: string,
        usefulLifeYears?: number,
        salvageValue?: number
    ) {
        this.companyId = companyId;
        this.deviceId = deviceId;
        this.deviceConfigId = deviceConfigId;
        this.model = model;
        this.serialNumber = serialNumber;
        this.boxNo = boxNo;
        this.configuration = configuration;
        this.assignedToEmployeeId = assignedToEmployeeId;
        this.previousUserEmployeeId = previousUserEmployeeId;
        this.purchaseDate = purchaseDate;
        this.assetStatusEnum = assetStatusEnum;
        this.warrantyExpiry = warrantyExpiry;
        this.userAssignedDate = userAssignedDate;
        this.lastReturnDate = lastReturnDate;
        this.complianceStatus = complianceStatus;
        this.lastSync = lastSync;
        this.encryptionStatus = encryptionStatus;
        this.batteryLevel = batteryLevel;
        this.storageAvailable = storageAvailable;
        this.purchaseCost = purchaseCost;
        this.currentValue = currentValue;
        this.depreciationMethod = depreciationMethod;
        this.usefulLifeYears = usefulLifeYears;
        this.salvageValue = salvageValue;
    }
}

export class UpdateAssetModel extends CreateAssetModel {
    id: number;
    constructor(
        id: number,
        companyId: number,
        deviceId: number,
        serialNumber: string,
        assetStatusEnum: AssetStatusEnum = AssetStatusEnum.AVAILABLE,
        purchaseDate?: string,
        warrantyExpiry?: string,
        deviceConfigId?: number,
        model?: string,
        configuration?: string,
        assignedToEmployeeId?: number,
        previousUserEmployeeId?: number,
        userAssignedDate?: string,
        lastReturnDate?: string,
        boxNo?: string,
        complianceStatus?: ComplianceStatusEnum,
        lastSync?: string,
        encryptionStatus?: EncryptionStatusEnum,
        batteryLevel?: number,
        storageAvailable?: string,
        purchaseCost?: number,
        currentValue?: number,
        depreciationMethod?: string,
        usefulLifeYears?: number,
        salvageValue?: number
    ) {
        super(companyId, deviceId, serialNumber, assetStatusEnum, purchaseDate, warrantyExpiry, deviceConfigId, model, configuration, assignedToEmployeeId, previousUserEmployeeId, userAssignedDate, lastReturnDate, boxNo, complianceStatus, lastSync, encryptionStatus, batteryLevel, storageAvailable, purchaseCost, currentValue, depreciationMethod, usefulLifeYears, salvageValue);
        this.id = id;
    }
}

export class DeleteAssetModel {
    id: number;
    constructor(id: number) {
        this.id = id;
    }
}

export class GetAssetModel {
    id: number;
    constructor(id: number) {
        this.id = id;
    }
}

export class AssetResponseModel {
    id: number;
    companyId: number;
    deviceId: number;
    deviceConfigId?: number;
    model?: string;
    serialNumber: string;
    boxNo?: string;
    configuration?: string;
    assignedToEmployeeId?: number;
    previousUserEmployeeId?: number;
    purchaseDate?: Date;
    warrantyExpiry?: Date;
    assetStatusEnum: AssetStatusEnum;
    userAssignedDate?: Date;
    lastReturnDate?: Date;
    complianceStatus?: ComplianceStatusEnum;
    lastSync?: Date;
    encryptionStatus?: EncryptionStatusEnum;
    batteryLevel?: number;
    storageAvailable?: string;
    purchaseCost?: number;
    currentValue?: number;
    depreciationMethod?: string;
    usefulLifeYears?: number;
    salvageValue?: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(
        id: number,
        companyId: number,
        deviceId: number,
        serialNumber: string,
        assetStatusEnum: AssetStatusEnum,
        createdAt: Date,
        updatedAt: Date,
        purchaseDate?: Date,
        warrantyExpiry?: Date,
        deviceConfigId?: number,
        model?: string,
        configuration?: string,
        assignedToEmployeeId?: number,
        previousUserEmployeeId?: number,
        userAssignedDate?: Date,
        lastReturnDate?: Date,
        boxNo?: string,
        complianceStatus?: ComplianceStatusEnum,
        lastSync?: Date,
        encryptionStatus?: EncryptionStatusEnum,
        batteryLevel?: number,
        storageAvailable?: string,
        purchaseCost?: number,
        currentValue?: number,
        depreciationMethod?: string,
        usefulLifeYears?: number,
        salvageValue?: number
    ) {
        this.id = id;
        this.companyId = companyId;
        this.deviceId = deviceId;
        this.deviceConfigId = deviceConfigId;
        this.model = model;
        this.serialNumber = serialNumber;
        this.boxNo = boxNo;
        this.configuration = configuration;
        this.assignedToEmployeeId = assignedToEmployeeId;
        this.previousUserEmployeeId = previousUserEmployeeId;
        this.purchaseDate = purchaseDate;
        this.assetStatusEnum = assetStatusEnum;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.warrantyExpiry = warrantyExpiry;
        this.userAssignedDate = userAssignedDate;
        this.lastReturnDate = lastReturnDate;
        this.complianceStatus = complianceStatus;
        this.lastSync = lastSync;
        this.encryptionStatus = encryptionStatus;
        this.batteryLevel = batteryLevel;
        this.storageAvailable = storageAvailable;
        this.purchaseCost = purchaseCost;
        this.currentValue = currentValue;
        this.depreciationMethod = depreciationMethod;
        this.usefulLifeYears = usefulLifeYears;
        this.salvageValue = salvageValue;
    }
}

export class GetAllAssetsModel extends GlobalResponse {
    assets: AssetResponseModel[];
    constructor(status: boolean, code: number, message: string, assets: AssetResponseModel[]) {
        super(status, code, message);
        this.assets = assets;
    }
}

export class GetAssetByIdModel extends GlobalResponse {
    asset: AssetResponseModel;
    constructor(status: boolean, code: number, message: string, asset: AssetResponseModel) {
        super(status, code, message);
        this.asset = asset;
    }
}

export class StatisticModel {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    retired: number;
    constructor(total: number, available: number, inUse: number, maintenance: number, retired: number) {
        this.total = total;
        this.available = available;
        this.inUse = inUse;
        this.maintenance = maintenance;
        this.retired = retired;
    }
}


export class AssetStatisticsResponseModel extends GlobalResponse {
    statistics: StatisticModel;
    constructor(
        status: boolean,
        code: number,
        message: string,
        statistics: StatisticModel
    ) {
        super(status, code, message);
        this.statistics = statistics;
    }
}

export class AssetSearchRequestModel {
    companyId: number;
    searchQuery?: string;
    statusFilter?: AssetStatusEnum[];
    deviceConfigIds?: number[];
    assetTypeIds?: number[];
    employeeId?: number;
    purchaseDateFrom?: Date;
    purchaseDateTo?: Date;
    constructor(
        companyId: number,
        searchQuery?: string,
        statusFilter?: AssetStatusEnum[],
        deviceConfigIds?: number[],
        assetTypeIds?: number[],
        employeeId?: number,
        purchaseDateFrom?: Date,
        purchaseDateTo?: Date
    ) {
        this.companyId = companyId;
        this.searchQuery = searchQuery;
        this.statusFilter = statusFilter;
        this.deviceConfigIds = deviceConfigIds;
        this.assetTypeIds = assetTypeIds;
        this.employeeId = employeeId;
        this.purchaseDateFrom = purchaseDateFrom;
        this.purchaseDateTo = purchaseDateTo;
    }
}

export class AssetWithAssignmentModel {
    id: number;
    companyId: number;
    deviceId: number;
    deviceName?: string;
    serialNumber: string;
    purchaseDate?: Date;
    warrantyExpiry?: Date;
    assetStatusEnum: AssetStatusEnum;
    userAssignedDate?: Date;
    lastReturnDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    assignedTo?: string;
    managerName?: string;
    assignedDate?: Date;
    assignedById?: number;
    configuration?: string;

    constructor(
        id: number,
        companyId: number,
        deviceId: number,
        serialNumber: string,
        assetStatusEnum: AssetStatusEnum,
        createdAt: Date,
        updatedAt: Date,
        purchaseDate?: Date,
        warrantyExpiry?: Date,
        deviceName?: string,
        assignedTo?: string,
        assignedDate?: Date,
        assignedById?: number,
        userAssignedDate?: Date,
        lastReturnDate?: Date,
        managerName?: string,
        configuration?: string
    ) {
        this.id = id;
        this.companyId = companyId;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.serialNumber = serialNumber;
        this.purchaseDate = purchaseDate;
        this.assetStatusEnum = assetStatusEnum;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.warrantyExpiry = warrantyExpiry;
        this.assignedTo = assignedTo;
        this.assignedDate = assignedDate;
        this.assignedById = assignedById;
        this.userAssignedDate = userAssignedDate;
        this.lastReturnDate = lastReturnDate;
        this.managerName = managerName;
        this.configuration = configuration;
    }
}

export class GetAssetsWithAssignmentsResponseModel extends GlobalResponse {
    assets: AssetWithAssignmentModel[];

    constructor(status: boolean, code: number, message: string, assets: AssetWithAssignmentModel[]) {
        super(status, code, message);
        this.assets = assets;
    }
}

export class AssignAssetOpRequestModel {
    assetId: number;
    employeeId: number;
    userId: number;
    remarks?: string;
    assignedDate?: Date;

    constructor(assetId: number, employeeId: number, userId: number, remarks?: string, assignedDate?: Date) {
        this.assetId = assetId;
        this.employeeId = employeeId;
        this.userId = userId;
        this.remarks = remarks;
        this.assignedDate = assignedDate;
    }
}

export class ReturnAssetOpRequestModel {
    assetId: number;
    userId: number;
    remarks?: string;
    targetStatus?: AssetStatusEnum;

    constructor(assetId: number, userId: number, remarks?: string, targetStatus?: AssetStatusEnum) {
        this.assetId = assetId;
        this.userId = userId;
        this.remarks = remarks;
        this.targetStatus = targetStatus;
    }
}

export class GetExpiringWarrantyRequestModel {
    companyId: number;
    months?: number;

    constructor(companyId: number, months = 3) {
        this.companyId = companyId;
        this.months = months;
    }
}
