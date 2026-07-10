import { GlobalResponse } from '../common/global-response';
import { EmailTypeEnum, EmployeeStatusEnum, EmailStatusEnum } from '../enums';
import { IsOptional, IsArray, IsString, IsEnum, IsNumber } from 'class-validator';

export class CreateEmailInfoModel {
    companyId: number;
    emailType: EmailTypeEnum;
    department: string;
    email: string;
    employeeId?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    memberIds?: string[];

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    billing?: number;

    @IsOptional()
    createdDate?: Date;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(EmailStatusEnum)
    status?: EmailStatusEnum;

    constructor(
        companyId: number,
        emailType: EmailTypeEnum,
        department: string,
        email: string,
        employeeId?: number,
        memberIds?: string[],
        name?: string,
        billing?: number,
        createdDate?: Date,
        description?: string,
        status?: EmailStatusEnum
    ) {
        this.companyId = companyId;
        this.emailType = emailType;
        this.department = department;
        this.email = email;
        this.employeeId = employeeId;
        this.memberIds = memberIds;
        this.name = name;
        this.billing = billing;
        this.createdDate = createdDate;
        this.description = description;
        this.status = status;
    }
}

export class UpdateEmailInfoModel extends CreateEmailInfoModel {
    id: number;

    constructor(
        id: number,
        companyId: number,
        emailType: EmailTypeEnum,
        department: string,
        email: string,
        employeeId?: number,
        memberIds?: string[],
        name?: string,
        billing?: number,
        createdDate?: Date,
        description?: string,
        status?: EmailStatusEnum
    ) {
        super(companyId, emailType, department, email, employeeId, memberIds, name, billing, createdDate, description, status);
        this.id = id;
    }
}

export class DeleteEmailInfoModel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

export class GetEmailInfoModel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

export class EmailInfoResponseModel {
    id: number;
    companyId: number;
    emailType: EmailTypeEnum;
    department: string;
    email: string;
    employeeId?: number;
    employeeName?: string;
    employeeStatus?: EmployeeStatusEnum;
    memberIds?: string[];
    name?: string;
    billing?: number;
    createdDate?: Date;
    description?: string;
    status?: EmailStatusEnum;

    constructor(
        id: number,
        companyId: number,
        emailType: EmailTypeEnum,
        department: string,
        email: string,
        employeeId?: number,
        employeeName?: string,
        employeeStatus?: EmployeeStatusEnum,
        memberIds?: string[],
        name?: string,
        billing?: number,
        createdDate?: Date,
        description?: string,
        status?: EmailStatusEnum
    ) {
        this.id = id;
        this.companyId = companyId;
        this.emailType = emailType;
        this.department = department;
        this.email = email;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeStatus = employeeStatus;
        this.memberIds = memberIds;
        this.name = name;
        this.billing = billing;
        this.createdDate = createdDate;
        this.description = description;
        this.status = status;
    }
}

export class GetAllEmailInfoModel extends GlobalResponse {
    override data: EmailInfoResponseModel[];
    constructor(status: boolean, code: number, message: string, data: EmailInfoResponseModel[]) {
        super(status, code, message);
        this.data = data;
    }
}

export class GetEmailInfoByIdModel extends GlobalResponse {
    override data: EmailInfoResponseModel;
    constructor(status: boolean, code: number, message: string, data: EmailInfoResponseModel) {
        super(status, code, message);
        this.data = data;
    }
}

export class EmailStatsResponseModel extends GlobalResponse {
    override data: {
        byType: any[];
        byStatus: any[];
    };
    constructor(status: boolean, code: number, message: string, data: { byType: any[]; byStatus: any[] }) {
        super(status, code, message);
        this.data = data;
    }
}

export class SendTicketCreatedEmailModel {
    ticket: any;
    recipientEmail: string;
    roleName: string;

    constructor(ticket: any, recipientEmail: string, roleName: string) {
        this.ticket = ticket;
        this.recipientEmail = recipientEmail;
        this.roleName = roleName;
    }
}

export class SendPasswordResetEmailModel {
    email: string;
    token: string;

    constructor(email: string, token: string) {
        this.email = email;
        this.token = token;
    }
}

export class SendAssetApprovalEmailModel {
    approverEmail: string;
    companyId: number;
    requesterName: string;
    message?: string;
    assetStats?: {
        total: number;
        available: number;
        inUse: number;
        maintenance: number;
        retired: number;
    };

    constructor(
        approverEmail: string,
        companyId: number,
        requesterName: string,
        message?: string,
        assetStats?: {
            total: number;
            available: number;
            inUse: number;
            maintenance: number;
            retired: number;
        }
    ) {
        this.approverEmail = approverEmail;
        this.companyId = companyId;
        this.requesterName = requesterName;
        this.message = message;
        this.assetStats = assetStats;
    }
}

export class SendAssetAssignedEmailModel {
    recipientEmail: string;
    recipientName: string;
    assetName: string; // e.g., "MacBook Pro (SN: 12345)"
    assignedBy: string;
    assignedDate: Date;
    isReassignment: boolean;
    remarks?: string;
    assignedToName?: string;
    recipientRole?: 'ASSIGNEE' | 'MANAGER' | 'ADMIN';
    assetType: string;
    serialNumber: string;
    specification: string;

    constructor(
        recipientEmail: string,
        recipientName: string,
        assetName: string,
        assignedBy: string,
        assignedDate: Date,
        assetType: string,
        serialNumber: string,
        specification: string,
        isReassignment = false,
        remarks?: string,
        assignedToName?: string,
        recipientRole: 'ASSIGNEE' | 'MANAGER' | 'ADMIN' = 'ASSIGNEE'
    ) {
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.assetName = assetName;
        this.assignedBy = assignedBy;
        this.assignedDate = assignedDate;
        this.isReassignment = isReassignment;
        this.remarks = remarks;
        this.assignedToName = assignedToName;
        this.recipientRole = recipientRole;
        this.assetType = assetType;
        this.serialNumber = serialNumber;
        this.specification = specification;
    }
}

export class SendTicketStatusUpdateEmailModel {
    ticket: any;
    recipientEmail: string;
    roleName: string;
    oldStatus: string;
    newStatus: string;

    constructor(ticket: any, recipientEmail: string, roleName: string, oldStatus: string, newStatus: string) {
        this.ticket = ticket;
        this.recipientEmail = recipientEmail;
        this.roleName = roleName;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }
}



export class SendPOApprovalEmailModel {
    recipientEmails: string[];
    recipientNames: string[];
    poNumber: string;
    requesterName: string;
    totalAmount: number;
    vendorName: string;
    poId: number;

    constructor(
        recipientEmails: string[],
        recipientNames: string[],
        poNumber: string,
        requesterName: string,
        totalAmount: number,
        vendorName: string,
        poId: number
    ) {
        this.recipientEmails = recipientEmails;
        this.recipientNames = recipientNames;
        this.poNumber = poNumber;
        this.requesterName = requesterName;
        this.totalAmount = totalAmount;
        this.vendorName = vendorName;
        this.poId = poId;
    }
}
