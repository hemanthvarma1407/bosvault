import { GlobalResponse } from '../common/global-response';
import { EmployeeStatusEnum } from '../enums';

export class CreateEmployeeModel {
    companyId: number;
    firstName: string;
    lastName: string;
    email: string;
    phNumber?: string;
    empStatus: EmployeeStatusEnum;
    billingAmount?: number;
    departmentId: number;
    remarks?: string;
    slackUserId?: string;
    slackDisplayName?: string;
    slackAvatar?: string;
    isSlackActive?: boolean;

    managerId?: number | null;

    userId: number;

    // New Fields
    joiningDate?: Date;
    emailCreatedDate?: Date;
    lastWorkingDay?: Date;
    emailDeletionDate?: Date;
    groupEmails?: string[];
    userRole?: string;

    constructor(
        userId: number,
        companyId: number,
        firstName: string,
        lastName: string,
        email: string,
        departmentId: number,
        empStatus: EmployeeStatusEnum = EmployeeStatusEnum.ACTIVE,
        phNumber?: string,
        billingAmount?: number,
        remarks?: string,
        slackUserId?: string,
        slackDisplayName?: string,
        slackAvatar?: string,
        isSlackActive?: boolean,
        managerId?: number | null,
        joiningDate?: Date,
        emailCreatedDate?: Date,
        lastWorkingDay?: Date,
        emailDeletionDate?: Date,
        groupEmails?: string[],
        userRole?: string
    ) {
        this.userId = userId;
        this.companyId = companyId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.departmentId = departmentId;
        this.empStatus = empStatus;
        this.phNumber = phNumber;
        this.billingAmount = billingAmount;
        this.remarks = remarks;
        this.slackUserId = slackUserId;
        this.slackDisplayName = slackDisplayName;
        this.slackAvatar = slackAvatar;
        this.isSlackActive = isSlackActive;
        this.managerId = managerId;
        this.joiningDate = joiningDate;
        this.emailCreatedDate = emailCreatedDate;
        this.lastWorkingDay = lastWorkingDay;
        this.emailDeletionDate = emailDeletionDate;
        this.groupEmails = groupEmails;
        this.userRole = userRole;
    }
}

export class UpdateEmployeeModel extends CreateEmployeeModel {
    id: number;

    constructor(
        id: number,
        userId: number,
        companyId: number,
        firstName: string,
        lastName: string,
        email: string,
        departmentId: number,
        empStatus: EmployeeStatusEnum = EmployeeStatusEnum.ACTIVE,
        phNumber?: string,
        billingAmount?: number,
        remarks?: string,
        slackUserId?: string,
        slackDisplayName?: string,
        slackAvatar?: string,
        isSlackActive?: boolean,
        managerId?: number | null,
        joiningDate?: Date,
        emailCreatedDate?: Date,
        lastWorkingDay?: Date,
        emailDeletionDate?: Date,
        groupEmails?: string[],
        userRole?: string
    ) {
        super(userId, companyId, firstName, lastName, email, departmentId, empStatus, phNumber, billingAmount, remarks, slackUserId, slackDisplayName, slackAvatar, isSlackActive, managerId, joiningDate, emailCreatedDate, lastWorkingDay, emailDeletionDate, groupEmails, userRole);
        this.id = id;
    }
}

export class DeleteEmployeeModel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

export class GetEmployeeModel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

export class EmployeeResponseModel {
    id: number;
    companyId: number;
    firstName: string;
    lastName: string;
    email: string;
    phNumber?: string;
    empStatus: EmployeeStatusEnum;
    billingAmount?: number;
    departmentId: number;
    departmentName?: string;
    remarks?: string;
    slackUserId?: string;
    slackDisplayName?: string;
    slackAvatar?: string;
    isSlackActive?: boolean;
    managerId?: number | null;
    managerName?: string;
    userRole?: string;
    userId?: number;

    // New Fields
    joiningDate?: Date;
    emailCreatedDate?: Date;
    lastWorkingDay?: Date;
    emailDeletionDate?: Date;
    groupEmails?: string[];

    constructor(
        id: number,
        companyId: number,
        firstName: string,
        lastName: string,
        email: string,
        departmentId: number,
        empStatus: EmployeeStatusEnum,
        phNumber?: string,
        billingAmount?: number,
        remarks?: string,
        departmentName?: string,
        slackUserId?: string,
        slackDisplayName?: string,
        slackAvatar?: string,
        isSlackActive?: boolean,
        managerId?: number | null,
        managerName?: string,
        userRole?: string,
        userId?: number,
        joiningDate?: Date,
        emailCreatedDate?: Date,
        lastWorkingDay?: Date,
        emailDeletionDate?: Date,
        groupEmails?: string[]
    ) {
        this.id = id;
        this.companyId = companyId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.departmentId = departmentId;
        this.empStatus = empStatus;
        this.phNumber = phNumber;
        this.billingAmount = billingAmount;
        this.remarks = remarks;
        this.departmentName = departmentName;
        this.slackUserId = slackUserId;
        this.slackDisplayName = slackDisplayName;
        this.slackAvatar = slackAvatar;
        this.isSlackActive = isSlackActive;
        this.managerId = managerId;
        this.managerName = managerName;
        this.userRole = userRole;
        this.userId = userId;
        this.joiningDate = joiningDate;
        this.emailCreatedDate = emailCreatedDate;
        this.lastWorkingDay = lastWorkingDay;
        this.emailDeletionDate = emailDeletionDate;
        this.groupEmails = groupEmails;
    }
}

export class GlobalEmployeeResponseModel extends GlobalResponse<EmployeeResponseModel> {
    constructor(status: boolean, code: number, message: string, employee: EmployeeResponseModel) {
        super(status, code, message, employee);
    }
}

export class GetAllEmployeesResponseModel extends GlobalResponse<EmployeeResponseModel[]> {
    constructor(status: boolean, code: number, message: string, employees: EmployeeResponseModel[]) {
        super(status, code, message, employees);
    }
}

export class GetAllEmployeesRequestModel {
    companyId: number;
    includeDeactivated?: boolean;
    constructor(companyId: number, includeDeactivated?: boolean) {
        this.companyId = companyId;
        this.includeDeactivated = includeDeactivated;
    }
}

export class GetEmployeeResponseModel extends GlobalEmployeeResponseModel { }
