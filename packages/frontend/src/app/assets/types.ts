import { AssetStatusEnum, ComplianceStatusEnum, EncryptionStatusEnum } from '@bosvault/shared-models';

export interface Asset {
    id: number | string;
    assetName: string;
    assetType?: string;
    serialNumber?: string;
    companyId?: number | string;
    deviceId?: number | string;
    deviceConfigId?: number | string;
    model?: string;
    configuration?: string;
    status?: AssetStatusEnum | string;
    assetStatusEnum?: AssetStatusEnum;
    purchaseDate?: string;
    warrantyExpiry?: string;
    createdAt?: string;
    assignedTo?: string;
    assignedDate?: string;
    userAssignedDate?: string;
    lastReturnDate?: string;
    assignedToEmployeeId?: number;
    previousUserEmployeeId?: number;
    previousUser?: string;
    managerName?: string;
    qrCodePath?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    purchaseCost?: number;
    currentValue?: number;
    boxNo?: string;
    complianceStatus?: ComplianceStatusEnum;
    encryptionStatus?: EncryptionStatusEnum;
    storageAvailable?: string;
}

export interface EmployeeOption {
    id: number | string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    managerName?: string;
}

export interface OptionItem {
    id: number | string;
    name?: string;
    companyName?: string;
    modelName?: string;
    deviceName?: string;
    assetType?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    laptopCompany?: string;
    configuration?: string;
}

export interface AssetFilterState {
    deviceConfigIds: (number | string)[];
    assetTypeIds: (number | string)[];
    statusFilter: AssetStatusEnum[];
    purchaseDateFrom: string;
    purchaseDateTo: string;
}
