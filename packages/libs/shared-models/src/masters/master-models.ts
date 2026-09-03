import { GlobalResponse } from '../common/global-response';


// ============================================
// COMPANY MODELS
// ============================================
export class CreateCompanyModel {
    companyName: string;
    location: string;
    estDate: Date;
    email?: string;
    phone?: string;
    userId?: number;
    slackBotToken?: string;
    slackWorkspaceId?: string;
    constructor(companyName: string, location: string, estDate: Date, email?: string, phone?: string, userId?: number, slackBotToken?: string, slackWorkspaceId?: string) {
        this.companyName = companyName;
        this.location = location;
        this.estDate = estDate;
        this.email = email;
        this.phone = phone;
        this.userId = userId;
        this.slackBotToken = slackBotToken;
        this.slackWorkspaceId = slackWorkspaceId;
    }
}

export class UpdateCompanyModel extends CreateCompanyModel {
    id: number;
    constructor(id: number, companyName: string, location: string, estDate: Date, email?: string, phone?: string, userId?: number, slackBotToken?: string, slackWorkspaceId?: string) {
        super(companyName, location, estDate, email, phone, userId, slackBotToken, slackWorkspaceId);
        this.id = id;
    }
}

export class DeleteCompanyModel {
    id: number;
    constructor(id: number) {
        this.id = id;
    }
}

export class GetCompanyModel {
    id: number;
    constructor(id: number) {
        this.id = id;
    }
}

export class CompanyResponseModel {
    id: number;
    companyName: string;
    location: string;
    estDate: Date;
    email: string;
    phone: string;
    slackBotToken?: string;
    slackWorkspaceId?: string;
    constructor(
        id: number,
        companyName: string,
        location: string,
        estDate: Date,
        email: string,
        phone: string,
        slackBotToken?: string,
        slackWorkspaceId?: string
    ) {
        this.id = id;
        this.companyName = companyName;
        this.location = location;
        this.estDate = estDate;
        this.email = email;
        this.phone = phone;
        this.slackBotToken = slackBotToken;
        this.slackWorkspaceId = slackWorkspaceId;
    }
}

export class CompanyResponse extends GlobalResponse {
    data: CompanyResponseModel[];
    constructor(status: boolean, code: number, message: string, data: CompanyResponseModel[]) {
        super(status, code, message);
        this.data = data;
    }
}

export class CompanyDropdownModel {
    id: number;
    name: string;
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }
}

export class CompanyDropdownResponse extends GlobalResponse {
    data: CompanyDropdownModel[];
    constructor(status: boolean, code: number, message: string, data: CompanyDropdownModel[]) {
        super(status, code, message);
        this.data = data;
    }
}

//----------------------------------------------------------------------------------------------------------------------------


// ============================================
// BASE INTERFACES
// ============================================
export class MasterBase {
    id: number;
    userId: number;
    companyId?: number;  // Optional - masters are shared across companies
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(
        id: number,
        userId: number,
        name: string,
        isActive: boolean,
        companyId?: number,
        description?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.isActive = isActive;
        this.companyId = companyId;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

export class Department extends MasterBase {
    code?: string;
    companyName?: string;

    constructor(
        id: number,
        userId: number,
        name: string,
        isActive: boolean,
        companyId?: number,
        description?: string,
        code?: string,
        companyName?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, userId, name, isActive, companyId, description, createdAt, updatedAt);
        this.code = code;
        this.companyName = companyName;
    }
}



export class AssetType extends MasterBase {
    code?: string;
    companyName?: string;

    constructor(
        id: number,
        userId: number,
        name: string,
        isActive: boolean,
        companyId?: number,
        description?: string,
        code?: string,
        companyName?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, userId, name, isActive, companyId, description, createdAt, updatedAt);
        this.code = code;
        this.companyName = companyName;
    }
}

export class DeviceConfig extends MasterBase {
    laptopCompany?: string;
    model?: string;
    configuration?: string;
    ram?: string;
    storage?: string;
    assetType?: string;

    constructor(
        id: number,
        userId: number,
        name: string,
        isActive: boolean,
        companyId?: number,
        description?: string,
        laptopCompany?: string,
        model?: string,
        configuration?: string,
        ram?: string,
        storage?: string,
        createdAt?: Date,
        updatedAt?: Date,
        assetType?: string
    ) {
        super(id, userId, name, isActive, companyId, description, createdAt, updatedAt);
        this.laptopCompany = laptopCompany;
        this.model = model;
        this.configuration = configuration;
        this.ram = ram;
        this.storage = storage;
        this.assetType = assetType;
    }
}


export class Vendor extends MasterBase {
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    category?: string;

    constructor(
        id: number,
        userId: number,
        name: string,
        isActive: boolean,
        companyId?: number,
        description?: string,
        contactPerson?: string,
        email?: string,
        phone?: string,
        address?: string,
        category?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, userId, name, isActive, companyId, description, createdAt, updatedAt);
        this.contactPerson = contactPerson;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.category = category;
    }
}





export class License extends MasterBase {
    purchaseDate?: Date;
    expiryDate?: Date;
    companyName?: string;
    totalQuantity?: number;
    usedQuantity?: number;
    usedCount?: number;
    price?: number;
    subscriptionPlan?: string;
    isPaid?: boolean;
    billingCycle?: string;
    currency?: string;

    constructor(
        id: number,
        userId: number,
        name: string,
        isActive: boolean,
        companyId?: number,
        description?: string,
        purchaseDate?: Date,
        expiryDate?: Date,
        companyName?: string,
        createdAt?: Date,
        updatedAt?: Date,
        totalQuantity?: number,
        usedQuantity?: number,
        usedCount?: number,
        price?: number,
        subscriptionPlan?: string,
        isPaid?: boolean,
        billingCycle?: string,
        currency?: string
    ) {
        super(id, userId, name, isActive, companyId, description, createdAt, updatedAt);
        this.purchaseDate = purchaseDate;
        this.expiryDate = expiryDate;
        this.companyName = companyName;
        this.totalQuantity = totalQuantity;
        this.usedQuantity = usedQuantity ?? usedCount;
        this.usedCount = usedCount ?? usedQuantity;
        this.price = price;
        this.subscriptionPlan = subscriptionPlan;
        this.isPaid = isPaid;
        this.billingCycle = billingCycle;
        this.currency = currency || 'USD';
    }
}

export class SlackUserModel extends MasterBase {
    email: string;
    slackUserId?: string;
    displayName?: string;
    role?: string;

    phone?: string;
    notes?: string;
    avatarUrl?: string;
    employeeId?: number;
    companyName?: string;
    isAdmin?: boolean;
    timezone?: string;
    timezoneLabel?: string;
    teamId?: string;
    isGuest?: boolean;
    isUltraRestricted?: boolean;
    isRestricted?: boolean;
    isStranger?: boolean;
    userType?: string;
    isBillable?: boolean;

    constructor(
        id: number,
        userId: number,
        name: string,
        isActive: boolean,
        email: string,
        companyId?: number,
        description?: string,
        slackUserId?: string,
        displayName?: string,
        role?: string,

        phone?: string,
        notes?: string,
        avatarUrl?: string,
        employeeId?: number,
        companyName?: string,
        createdAt?: Date,
        updatedAt?: Date,
        isAdmin?: boolean,
        timezone?: string,
        timezoneLabel?: string,
        teamId?: string,
        isGuest?: boolean,
        isUltraRestricted?: boolean,
        isRestricted?: boolean,
        isStranger?: boolean,
        userType?: string,
        isBillable?: boolean
    ) {
        super(id, userId, name, isActive, companyId, description, createdAt, updatedAt);
        this.email = email;
        this.slackUserId = slackUserId;
        this.displayName = displayName;
        this.role = role;

        this.phone = phone;
        this.notes = notes;
        this.avatarUrl = avatarUrl;
        this.employeeId = employeeId;
        this.companyName = companyName;
        this.isAdmin = isAdmin;
        this.timezone = timezone;
        this.timezoneLabel = timezoneLabel;
        this.teamId = teamId;
        this.isGuest = isGuest;
        this.isUltraRestricted = isUltraRestricted;
        this.isRestricted = isRestricted;
        this.isStranger = isStranger;
        this.userType = userType;
        this.isBillable = isBillable;
    }
}

// ============================================
// REQUEST MODELS - CREATE
// ============================================
export class CreateMasterModel {
    id?: number;
    userId: number;
    companyId?: number;  // Optional - masters are shared
    name: string;
    description?: string;
    isActive?: boolean = true;

    constructor(userId: number, companyId: number, name: string, description?: string, isActive?: boolean, id?: number) {
        this.userId = userId;
        this.companyId = companyId;
        this.name = name;
        this.description = description;
        this.isActive = isActive ?? true;
        this.id = id;
    }
}

export class CreateDepartmentModel extends CreateMasterModel {
    code?: string;
    constructor(userId: number, companyId: number, name: string, description?: string, isActive?: boolean, code?: string, id?: number) {
        super(userId, companyId, name, description, isActive, id);
        this.code = code;
    }
}



export class CreateAssetTypeModel extends CreateMasterModel {
    constructor(userId: number, companyId: number, name: string, description?: string, isActive?: boolean, id?: number) {
        super(userId, 0, name, description, isActive, id);
    }
}

export class CreateDeviceConfigModel extends CreateMasterModel {
    laptopCompany: string;
    model: string;
    configuration: string;
    ram: string;
    storage: string;
    assetType?: string;

    constructor(userId: number, companyId: number, name: string, description?: string, isActive?: boolean, laptopCompany?: string, model?: string, configuration?: string, ram?: string, storage?: string, id?: number, assetType?: string) {
        super(userId, 0, name, description, isActive, id);
        this.laptopCompany = laptopCompany || '';
        this.model = model || '';
        this.configuration = configuration || '';
        this.ram = ram || '';
        this.storage = storage || '';
        this.assetType = assetType;
    }
}

export class CreateSlackUserModel extends CreateMasterModel {
    email: string;
    slackUserId?: string;
    displayName?: string;
    role?: string;

    phone?: string;
    notes?: string;
    avatarUrl?: string;
    employeeId?: number;
    timezone?: string;
    timezoneLabel?: string;
    teamId?: string;
    isAdmin?: boolean;

    constructor(userId: number, companyId: number, name: string, email: string, description?: string, isActive?: boolean, slackUserId?: string, displayName?: string, role?: string, phone?: string, notes?: string, avatarUrl?: string, employeeId?: number, id?: number, timezone?: string, timezoneLabel?: string, teamId?: string, isAdmin?: boolean) {
        super(userId, companyId, name, description, isActive, id);
        this.email = email;
        this.slackUserId = slackUserId;
        this.displayName = displayName;
        this.role = role;

        this.phone = phone;
        this.notes = notes;
        this.avatarUrl = avatarUrl;
        this.employeeId = employeeId;
        this.isActive = isActive ?? true;
        this.timezone = timezone;
        this.timezoneLabel = timezoneLabel;
        this.teamId = teamId;
        this.isAdmin = isAdmin;
    }
}

export class CreateVendorModel extends CreateMasterModel {
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    category?: string;

    constructor(userId: number, companyId: number, name: string, description?: string, isActive?: boolean, contactPerson?: string, email?: string, phone?: string, address?: string, category?: string, id?: number) {
        super(userId, companyId, name, description, isActive, id);
        this.contactPerson = contactPerson;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.category = category;
    }
}










// ============================================
// REQUEST MODELS - UPDATE
// ============================================
export class UpdateDepartmentModel {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    code?: string;

    constructor(id: number, name: string, description?: string, isActive?: boolean, code?: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isActive = isActive ?? true;
        this.code = code;
    }
}

export class UpdateAssetTypeModel {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;

    constructor(id: number, name: string, description?: string, isActive?: boolean) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isActive = isActive ?? true;
    }
}

export class UpdateDeviceConfigModel {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    laptopCompany: string;
    model: string;
    configuration: string;
    ram: string;
    storage: string;
    assetType?: string;

    constructor(id: number, name: string, description?: string, isActive?: boolean, laptopCompany?: string, model?: string, configuration?: string, ram?: string, storage?: string, assetType?: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isActive = isActive ?? true;
        this.laptopCompany = laptopCompany || '';
        this.model = model || '';
        this.configuration = configuration || '';
        this.ram = ram || '';
        this.storage = storage || '';
        this.assetType = assetType;
    }
}

export class UpdateVendorModel {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    companyId?: number;
    category?: string;

    constructor(id: number, name: string, description?: string, isActive?: boolean, contactPerson?: string, email?: string, phone?: string, address?: string, companyId?: number, category?: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isActive = isActive ?? true;
        this.contactPerson = contactPerson;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.companyId = companyId;
        this.category = category;
    }
}










// ============================================
// RESPONSE MODELS - GET ALL
// ============================================
export class GetAllDepartmentsResponseModel extends GlobalResponse {
    departments: Department[];

    constructor(status: boolean, code: number, message: string, departments: Department[]) {
        super(status, code, message);
        this.departments = departments;
    }
}



export class GetAllAssetTypesResponseModel extends GlobalResponse {
    assetTypes: AssetType[];

    constructor(status: boolean, code: number, message: string, assetTypes: AssetType[]) {
        super(status, code, message);
        this.assetTypes = assetTypes;
    }
}

export class GetAllDeviceConfigsResponseModel extends GlobalResponse {
    deviceConfigs: DeviceConfig[];

    constructor(status: boolean, code: number, message: string, deviceConfigs: DeviceConfig[]) {
        super(status, code, message);
        this.deviceConfigs = deviceConfigs;
    }
}

export class GetAllVendorsResponseModel extends GlobalResponse {
    vendors: Vendor[];

    constructor(status: boolean, code: number, message: string, vendors: Vendor[]) {
        super(status, code, message);
        this.vendors = vendors;
    }
}










export class GetAllSlackUsersResponseModel extends GlobalResponse {
    slackUsers: SlackUserModel[];

    constructor(status: boolean, code: number, message: string, slackUsers: SlackUserModel[]) {
        super(status, code, message);
        this.slackUsers = slackUsers;
    }
}

// ============================================
// RESPONSE MODELS - CREATE (Single Item)
// ============================================
export class CreateDepartmentResponseModel extends GlobalResponse {
    department: Department;

    constructor(status: boolean, code: number, message: string, department: Department) {
        super(status, code, message);
        this.department = department;
    }
}



export class CreateAssetTypeResponseModel extends GlobalResponse {
    assetType: AssetType;

    constructor(status: boolean, code: number, message: string, assetType: AssetType) {
        super(status, code, message);
        this.assetType = assetType;
    }
}

export class CreateDeviceConfigResponseModel extends GlobalResponse {
    deviceConfig: DeviceConfig;

    constructor(status: boolean, code: number, message: string, deviceConfig: DeviceConfig) {
        super(status, code, message);
        this.deviceConfig = deviceConfig;
    }
}

// ============================================
// RESPONSE MODELS - UPDATE (Single Item)
// ============================================




export class UpdateDeviceConfigResponseModel extends GlobalResponse {
    deviceConfig: DeviceConfig;

    constructor(status: boolean, code: number, message: string, deviceConfig: DeviceConfig) {
        super(status, code, message);
        this.deviceConfig = deviceConfig;
    }
}











export class UpdateSlackUserModel {
    id: number;
    name: string;
    email: string;
    description?: string;
    isActive: boolean;
    slackUserId?: string;
    displayName?: string;
    role?: string;

    phone?: string;
    notes?: string;
    companyId?: number;
    avatarUrl?: string;
    isAdmin?: boolean;
    employeeId?: number;
    timezone?: string;
    timezoneLabel?: string;
    teamId?: string;

    constructor(id: number, name: string, email: string, description?: string, isActive = true, slackUserId?: string, displayName?: string, role?: string, phone?: string, notes?: string, companyId?: number, avatarUrl?: string, employeeId?: number, isAdmin?: boolean, timezone?: string, timezoneLabel?: string, teamId?: string) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.description = description;
        this.isActive = isActive;
        this.slackUserId = slackUserId;
        this.displayName = displayName;
        this.role = role;

        this.phone = phone;
        this.notes = notes;
        this.companyId = companyId;
        this.avatarUrl = avatarUrl;
        this.employeeId = employeeId;
        this.isAdmin = isAdmin;
        this.timezone = timezone;
        this.timezoneLabel = timezoneLabel;
        this.teamId = teamId;
    }
}


export class DepartmentDropdownModel {
    id: number;
    name: string;
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }
}

export class DepartmentDropdownResponse extends GlobalResponse {
    data: DepartmentDropdownModel[];
    constructor(status: boolean, code: number, message: string, data: DepartmentDropdownModel[]) {
        super(status, code, message);
        this.data = data;
    }
}

export class AssetTypeDropdownModel {
    id: number;
    name: string;
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }
}

export class AssetTypeDropdownResponse extends GlobalResponse {
    data: AssetTypeDropdownModel[];
    constructor(status: boolean, code: number, message: string, data: AssetTypeDropdownModel[]) {
        super(status, code, message);
        this.data = data;
    }
}

export class CredentialVaultModel {
    id!: number;
    companyId!: number;
    appName!: string;
    description?: string;
    password!: string;
    expireDate?: Date | string;
    owner!: string;
    deviceSerialNumber?: string;
    ipAddress?: string;
    recoveryEmail?: string;
    isActive?: boolean;
    createdBy!: number;
    updatedBy?: number;
    createdAt!: Date | string;
    updatedAt?: Date | string;
}

export class CreateCredentialVaultModel {
    createdBy!: number;
    companyId!: number;
    appName!: string;
    description?: string;
    password!: string;
    expireDate?: Date | string;
    owner!: string;
    deviceSerialNumber?: string;
    ipAddress?: string;
    recoveryEmail?: string;
    isActive?: boolean;

    constructor(
        createdBy: number,
        companyId: number,
        appName: string,
        description?: string,
        password?: string,
        expireDate?: Date | string,
        owner?: string,
        isActive?: boolean,
        deviceSerialNumber?: string,
        ipAddress?: string,
        recoveryEmail?: string
    ) {
        this.createdBy = createdBy;
        this.companyId = companyId;
        this.appName = appName;
        this.description = description;
        this.password = password || '';
        this.expireDate = expireDate;
        this.owner = owner || '';
        this.isActive = isActive;
        this.deviceSerialNumber = deviceSerialNumber;
        this.ipAddress = ipAddress;
        this.recoveryEmail = recoveryEmail;
    }
}

export class UpdateCredentialVaultModel {
    id!: number;
    appName?: string;
    description?: string;
    password?: string;
    expireDate?: Date | string;
    owner?: string;
    deviceSerialNumber?: string;
    ipAddress?: string;
    recoveryEmail?: string;
    isActive?: boolean;

    constructor(
        id: number,
        appName?: string,
        description?: string,
        password?: string,
        expireDate?: Date | string,
        owner?: string,
        isActive?: boolean,
        deviceSerialNumber?: string,
        ipAddress?: string,
        recoveryEmail?: string
    ) {
        this.id = id;
        this.appName = appName;
        this.description = description;
        this.password = password;
        this.expireDate = expireDate;
        this.owner = owner;
        this.isActive = isActive;
        this.deviceSerialNumber = deviceSerialNumber;
        this.ipAddress = ipAddress;
        this.recoveryEmail = recoveryEmail;
    }
}

export class DeleteCredentialVaultModel {
    id!: number;
}

export class GetAllCredentialVaultResponseModel extends GlobalResponse {
    data: CredentialVaultModel[];
    constructor(status: boolean, code: number, message: string, data: CredentialVaultModel[]) {
        super(status, code, message);
        this.data = data;
    }
}

export class RemoteMaster {
    id!: number;
    companyId!: number;
    remoteToolName!: string;
    userName!: string;
    userFullname?: string;
    deviceSerialNumber?: string;
    ipAddress?: string;
    recoveryEmail?: string;
    password!: string;
    notes?: string;
    isActive?: boolean;
    createdBy!: number;
    updatedBy?: number;
    createdAt!: Date | string;
    updatedAt?: Date | string;
}

export class CreateRemoteMasterModel {
    createdBy!: number;
    companyId!: number;
    remoteToolName!: string;
    userName!: string;
    userFullname?: string;
    deviceSerialNumber?: string;
    ipAddress?: string;
    recoveryEmail?: string;
    password!: string;
    notes?: string;
    isActive?: boolean;

    constructor(
        createdBy: number,
        companyId: number,
        remoteToolName: string,
        userName: string,
        password: string,
        notes?: string,
        isActive?: boolean,
        userFullname?: string,
        deviceSerialNumber?: string,
        ipAddress?: string,
        recoveryEmail?: string
    ) {
        this.createdBy = createdBy;
        this.companyId = companyId;
        this.remoteToolName = remoteToolName;
        this.userName = userName;
        this.password = password;
        this.notes = notes;
        this.isActive = isActive;
        this.userFullname = userFullname;
        this.deviceSerialNumber = deviceSerialNumber;
        this.ipAddress = ipAddress;
        this.recoveryEmail = recoveryEmail;
    }
}

export class UpdateRemoteMasterModel {
    id!: number;
    remoteToolName?: string;
    userName?: string;
    userFullname?: string;
    deviceSerialNumber?: string;
    ipAddress?: string;
    recoveryEmail?: string;
    password?: string;
    notes?: string;
    isActive?: boolean;

    constructor(
        id: number,
        remoteToolName?: string,
        userName?: string,
        password?: string,
        notes?: string,
        isActive?: boolean,
        userFullname?: string,
        deviceSerialNumber?: string,
        ipAddress?: string,
        recoveryEmail?: string
    ) {
        this.id = id;
        this.remoteToolName = remoteToolName;
        this.userName = userName;
        this.password = password;
        this.notes = notes;
        this.isActive = isActive;
        this.userFullname = userFullname;
        this.deviceSerialNumber = deviceSerialNumber;
        this.ipAddress = ipAddress;
        this.recoveryEmail = recoveryEmail;
    }
}

export class DeleteRemoteMasterModel {
    id!: number;
}

export class GetAllRemoteMasterResponseModel extends GlobalResponse {
    data: RemoteMaster[];
    constructor(status: boolean, code: number, message: string, data: RemoteMaster[]) {
        super(status, code, message);
        this.data = data;
    }
}

export class CreateLicenseMasterModel extends CreateMasterModel {
    purchaseDate?: Date;
    expiryDate?: Date;
    totalQuantity?: number;
    price?: number;
    subscriptionPlan?: string;
    isPaid?: boolean;
    billingCycle?: string;
    currency?: string;

    constructor(
        userId: number,
        companyId: number,
        name: string,
        description?: string,
        isActive?: boolean,
        purchaseDate?: Date,
        expiryDate?: Date,
        totalQuantity?: number,
        id?: number,
        price?: number,
        subscriptionPlan?: string,
        isPaid?: boolean,
        billingCycle?: string,
        currency?: string
    ) {
        super(userId, companyId, name, description, isActive, id);
        this.purchaseDate = purchaseDate;
        this.expiryDate = expiryDate;
        this.totalQuantity = totalQuantity;
        this.price = price;
        this.subscriptionPlan = subscriptionPlan;
        this.isPaid = isPaid;
        this.billingCycle = billingCycle;
        this.currency = currency || 'USD';
    }
}

export class UpdateLicenseMasterModel {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    purchaseDate?: Date;
    expiryDate?: Date;
    totalQuantity?: number;
    price?: number;
    subscriptionPlan?: string;
    isPaid?: boolean;
    billingCycle?: string;
    currency?: string;

    constructor(
        id: number,
        name: string,
        description?: string,
        isActive = true,
        purchaseDate?: Date,
        expiryDate?: Date,
        totalQuantity?: number,
        price?: number,
        subscriptionPlan?: string,
        isPaid?: boolean,
        billingCycle?: string,
        currency?: string
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isActive = isActive;
        this.purchaseDate = purchaseDate;
        this.expiryDate = expiryDate;
        this.totalQuantity = totalQuantity;
        this.price = price;
        this.subscriptionPlan = subscriptionPlan;
        this.isPaid = isPaid;
        this.billingCycle = billingCycle;
        this.currency = currency || 'USD';
    }
}

export class GetAllLicenseMastersResponseModel extends GlobalResponse {
    licenses: License[];

    constructor(status: boolean, code: number, message: string, licenses: License[]) {
        super(status, code, message);
        this.licenses = licenses;
    }
}

export class CreateLicenseMasterResponseModel extends GlobalResponse {
    license: License;

    constructor(status: boolean, code: number, message: string, license: License) {
        super(status, code, message);
        this.license = license;
    }
}

export class UpdateLicenseMasterResponseModel extends GlobalResponse {
    license: License;

    constructor(status: boolean, code: number, message: string, license: License) {
        super(status, code, message);
        this.license = license;
    }
}

export class RequestVaultOtpModel {
    email: string;
    constructor(email: string) {
        this.email = email;
    }
}

export class ResetVaultPasswordOtpModel {
    email: string;
    otp: string;
    newPassword: string;
    constructor(email: string, otp: string, newPassword: string) {
        this.email = email;
        this.otp = otp;
        this.newPassword = newPassword;
    }
}


