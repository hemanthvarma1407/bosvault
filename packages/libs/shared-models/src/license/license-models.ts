import { GlobalResponse } from '../common/global-response';

/**
 * Request model for creating a new license assignment
 */
export class CreateLicenseModel {
    companyId: number;
    applicationId: number;
    assignedEmployeeId?: number;
    assignedEmployeeIds?: number[];
    licenseKey?: string;
    purchaseDate?: Date;
    assignedDate?: Date;
    expiryDate?: Date;
    seats?: number;
    remarks?: string;
    costPerSeat?: number;
    billingCycle?: string;
    role?: string;
    subscriptionPlan?: string;
    isPaid?: boolean;

    constructor(
        companyId: number,
        applicationId: number,
        assignedEmployeeId?: number,
        licenseKey?: string,
        purchaseDate?: Date,
        assignedDate?: Date,
        expiryDate?: Date,
        seats?: number,
        remarks?: string,
        costPerSeat?: number,
        billingCycle?: string,
        role?: string,
        subscriptionPlan?: string,
        isPaid?: boolean,
        assignedEmployeeIds?: number[]
    ) {
        this.companyId = companyId;
        this.applicationId = applicationId;
        this.assignedEmployeeId = assignedEmployeeId;
        this.assignedEmployeeIds = assignedEmployeeIds;
        this.licenseKey = licenseKey;
        this.purchaseDate = purchaseDate;
        this.assignedDate = assignedDate;
        this.expiryDate = expiryDate;
        this.seats = seats;
        this.remarks = remarks;
        this.costPerSeat = costPerSeat;
        this.billingCycle = billingCycle;
        this.role = role;
        this.subscriptionPlan = subscriptionPlan;
        this.isPaid = isPaid;
    }
}

/**
 * Request model for updating an existing license assignment
 */
export class UpdateLicenseModel {
    id: number;
    companyId?: number;
    applicationId?: number;
    assignedEmployeeId?: number;
    licenseKey?: string;
    purchaseDate?: Date;
    assignedDate?: Date;
    expiryDate?: Date;
    seats?: number;
    remarks?: string;
    costPerSeat?: number;
    billingCycle?: string;
    role?: string;
    subscriptionPlan?: string;
    isPaid?: boolean;

    constructor(
        id: number,
        companyId?: number,
        applicationId?: number,
        assignedEmployeeId?: number,
        licenseKey?: string,
        purchaseDate?: Date,
        assignedDate?: Date,
        expiryDate?: Date,
        seats?: number,
        remarks?: string,
        costPerSeat?: number,
        billingCycle?: string,
        role?: string,
        subscriptionPlan?: string,
        isPaid?: boolean
    ) {
        this.id = id;
        this.companyId = companyId;
        this.applicationId = applicationId;
        this.assignedEmployeeId = assignedEmployeeId;
        this.licenseKey = licenseKey;
        this.purchaseDate = purchaseDate;
        this.assignedDate = assignedDate;
        this.expiryDate = expiryDate;
        this.seats = seats;
        this.remarks = remarks;
        this.costPerSeat = costPerSeat;
        this.billingCycle = billingCycle;
        this.role = role;
        this.subscriptionPlan = subscriptionPlan;
        this.isPaid = isPaid;
    }
}

/**
 * Request model for deleting a license assignment
 */
export class DeleteLicenseModel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

/**
 * Request model for getting a specific license
 */


/**
 * Response model for a single license
 */
export class LicenseResponseModel {
    id: number;
    companyId: number;
    applicationId: number;
    assignedEmployeeId?: number | null;
    licenseKey?: string | null;
    purchaseDate?: Date | null;
    assignedDate?: Date | null;
    expiryDate?: Date | null;
    seats?: number | null;
    totalSeats?: number | null;
    costPerSeat?: number | null;
    billingCycle?: string | null;
    remarks?: string | null;
    role?: string | null;
    subscriptionPlan?: string | null;
    isPaid?: boolean | null;
    createdAt: Date;
    updatedAt: Date;
    company?: any;
    application?: any;
    assignedEmployee?: any;

    constructor(
        id: number,
        companyId: number,
        applicationId: number,
        createdAt: Date,
        updatedAt: Date,
        assignedEmployeeId?: number | null,
        licenseKey?: string | null,
        purchaseDate?: Date | null,
        assignedDate?: Date | null,
        expiryDate?: Date | null,
        seats?: number | null,
        totalSeats?: number | null,
        costPerSeat?: number | null,
        billingCycle?: string | null,
        remarks?: string | null,
        role?: string | null,
        company?: any,
        application?: any,
        assignedEmployee?: any,
        subscriptionPlan?: string | null,
        isPaid?: boolean | null
    ) {
        this.id = id;
        this.companyId = companyId;
        this.applicationId = applicationId;
        this.assignedEmployeeId = assignedEmployeeId;
        this.licenseKey = licenseKey;
        this.purchaseDate = purchaseDate;
        this.assignedDate = assignedDate;
        this.expiryDate = expiryDate;
        this.seats = seats;
        this.totalSeats = totalSeats;
        this.costPerSeat = costPerSeat;
        this.billingCycle = billingCycle;
        this.remarks = remarks;
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.company = company;
        this.application = application;
        this.assignedEmployee = assignedEmployee;
        this.subscriptionPlan = subscriptionPlan;
        this.isPaid = isPaid;
    }
}



export class GetAllLicensesResponseModel extends GlobalResponse<LicenseResponseModel[]> {
    licenses!: LicenseResponseModel[];
    constructor(status: boolean, code: number, message: string, data: LicenseResponseModel[]) {
        super(status, code, message, data);
        this.licenses = data;
    }
}



/**
 * Response model for license statistics
 */
export class LicenseStatsModel {
    totalLicenses: number;
    usedLicenses: number;
    totalCost: number;
    expiringSoon: number;

    constructor(totalLicenses: number, usedLicenses: number, totalCost: number, expiringSoon: number) {
        this.totalLicenses = totalLicenses;
        this.usedLicenses = usedLicenses;
        this.totalCost = totalCost;
        this.expiringSoon = expiringSoon;
    }
}

/**
 * Response model for license statistics endpoint
 */
export class GetLicenseStatisticsResponseModel extends GlobalResponse<LicenseStatsModel> {
    statistics!: LicenseStatsModel;
    constructor(status: boolean, code: number, message: string, data: LicenseStatsModel) {
        super(status, code, message, data);
        this.statistics = data;
    }
}
