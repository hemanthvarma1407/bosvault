import { GlobalResponse } from '../common/global-response';
import { TicketCategoryEnum, TicketPriorityEnum, TicketStatusEnum, TicketSeverityEnum } from '../enums';

// ============================================
// REQUEST MODELS - CREATE
// ============================================

export class CreateTicketModel {
    ticketCode: string;
    employeeId?: number;
    assignAdminId?: number;
    expectedCompletionDate?: Date;
    categoryEnum: TicketCategoryEnum;
    priorityEnum: TicketPriorityEnum;
    subject: string;
    ticketStatus: TicketStatusEnum;
    resolvedAt?: Date;
    timeSpentMinutes?: number;
    description?: string;
    subCategory?: string;
    severityEnum?: TicketSeverityEnum;
    department?: string;
    contactNumber?: string;
    location?: string;
    contactEmail?: string;
    assignedGroup?: string;
    slaType?: string;
    responseDueTime?: Date;
    escalationLevel?: number;
    adminComments?: string;
    userComments?: string;
    internalNotes?: string;
    rootCause?: string;
    resolutionSummary?: string;
    resolvedBy?: number;
    closureRemarks?: string;
    userRating?: number;
    userFeedback?: string;
    userEmail?: string;
    originalEstimate?: string;
    timeSpent?: string;

    constructor(
        ticketCode: string,
        categoryEnum: TicketCategoryEnum,
        priorityEnum: TicketPriorityEnum,
        subject: string,
        ticketStatus: TicketStatusEnum = TicketStatusEnum.OPEN,
        employeeId?: number,
        assignAdminId?: number,
        expectedCompletionDate?: Date,
        resolvedAt?: Date,
        timeSpentMinutes?: number,
        description?: string,
        subCategory?: string,
        severityEnum?: TicketSeverityEnum,
        department?: string,
        contactNumber?: string,
        location?: string,
        contactEmail?: string,
        assignedGroup?: string,
        slaType?: string,
        responseDueTime?: Date,
        escalationLevel?: number,
        adminComments?: string,
        userComments?: string,
        internalNotes?: string,
        rootCause?: string,
        resolutionSummary?: string,
        resolvedBy?: number,
        closureRemarks?: string,
        userRating?: number,
        userFeedback?: string,
        userEmail?: string
    ) {
        this.ticketCode = ticketCode;
        this.employeeId = employeeId;
        this.categoryEnum = categoryEnum;
        this.priorityEnum = priorityEnum;
        this.subject = subject;
        this.ticketStatus = ticketStatus;
        this.assignAdminId = assignAdminId;
        this.expectedCompletionDate = expectedCompletionDate;
        this.resolvedAt = resolvedAt;
        this.timeSpentMinutes = timeSpentMinutes;
        this.description = description;
        this.subCategory = subCategory;
        this.severityEnum = severityEnum;
        this.department = department;
        this.contactNumber = contactNumber;
        this.location = location;
        this.contactEmail = contactEmail;
        this.assignedGroup = assignedGroup;
        this.slaType = slaType;
        this.responseDueTime = responseDueTime;
        this.escalationLevel = escalationLevel;
        this.adminComments = adminComments;
        this.userComments = userComments;
        this.internalNotes = internalNotes;
        this.rootCause = rootCause;
        this.resolutionSummary = resolutionSummary;
        this.resolvedBy = resolvedBy;
        this.closureRemarks = closureRemarks;
        this.userRating = userRating;
        this.userFeedback = userFeedback;
        this.userEmail = userEmail;
    }
}

// ============================================
// REQUEST MODELS - UPDATE
// ============================================

export class UpdateTicketModel extends CreateTicketModel {
    id: number;

    constructor(
        id: number,
        ticketCode: string,
        categoryEnum: TicketCategoryEnum,
        priorityEnum: TicketPriorityEnum,
        subject: string,
        ticketStatus: TicketStatusEnum = TicketStatusEnum.OPEN,
        employeeId?: number,
        assignAdminId?: number,
        expectedCompletionDate?: Date,
        resolvedAt?: Date,
        timeSpentMinutes?: number,
        description?: string,
        subCategory?: string,
        severityEnum?: TicketSeverityEnum,
        department?: string,
        contactNumber?: string,
        location?: string,
        contactEmail?: string,
        assignedGroup?: string,
        slaType?: string,
        responseDueTime?: Date,
        escalationLevel?: number,
        adminComments?: string,
        userComments?: string,
        internalNotes?: string,
        rootCause?: string,
        resolutionSummary?: string,
        resolvedBy?: number,
        closureRemarks?: string,
        userRating?: number,
        userFeedback?: string,
        userEmail?: string
    ) {
        super(ticketCode, categoryEnum, priorityEnum, subject, ticketStatus, employeeId, assignAdminId, expectedCompletionDate, resolvedAt, timeSpentMinutes, description, subCategory, severityEnum, department, contactNumber, location, contactEmail, assignedGroup, slaType, responseDueTime, escalationLevel, adminComments, userComments, internalNotes, rootCause, resolutionSummary, resolvedBy, closureRemarks, userRating, userFeedback, userEmail);
        this.id = id;
    }
}

export class UpdateTicketStatusRequestModel {
    id: number;
    status: TicketStatusEnum;

    constructor(id: number, status: TicketStatusEnum) {
        this.id = id;
        this.status = status;
    }
}

export class AssignTicketRequestModel {
    id: number;
    assignAdminId: number;

    constructor(id: number, assignAdminId: number) {
        this.id = id;
        this.assignAdminId = assignAdminId;
    }
}

export class AddTicketResponseRequestModel {
    id: number;
    response: string;

    constructor(id: number, response: string) {
        this.id = id;
        this.response = response;
    }
}

// ============================================
// REQUEST MODELS - GET/DELETE
// ============================================

export class DeleteTicketModel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

export class GetTicketModel {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}



export class GetTicketStatisticsRequestModel {
    companyId: number;

    constructor(companyId: number) {
        this.companyId = companyId;
    }
}

// ============================================
// DATA MODELS
// ============================================

export class TicketResponseModel {
    id: number;
    ticketCode: string;
    employeeId: number;
    employeeName?: string;
    employeeEmail?: string;
    assignAdminId?: number;
    expectedCompletionDate?: Date;
    categoryEnum: TicketCategoryEnum;
    priorityEnum: TicketPriorityEnum;
    subject: string;
    ticketStatus: TicketStatusEnum;
    resolvedAt?: Date;
    slaDeadline?: Date;
    timeSpentMinutes?: number;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    subCategory?: string;
    severityEnum?: TicketSeverityEnum;
    department?: string;
    contactNumber?: string;
    location?: string;
    contactEmail?: string;
    assignedGroup?: string;
    slaType?: string;
    responseDueTime?: Date;
    escalationLevel?: number;
    adminComments?: string;
    userComments?: string;
    internalNotes?: string;
    rootCause?: string;
    resolutionSummary?: string;
    resolvedBy?: number;
    closureRemarks?: string;
    userRating?: number;
    userFeedback?: string;
    originalEstimate?: string;
    timeSpent?: string;

    constructor(
        id: number,
        ticketCode: string,
        employeeId: number,
        categoryEnum: TicketCategoryEnum,
        priorityEnum: TicketPriorityEnum,
        subject: string,
        ticketStatus: TicketStatusEnum,
        assignAdminId?: number,
        expectedCompletionDate?: Date,
        resolvedAt?: Date,
        employeeName?: string,
        employeeEmail?: string,
        createdAt?: Date,
        updatedAt?: Date,
        slaDeadline?: Date,
        timeSpentMinutes?: number,
        description?: string,
        subCategory?: string,
        severityEnum?: TicketSeverityEnum,
        department?: string,
        contactNumber?: string,
        location?: string,
        contactEmail?: string,
        assignedGroup?: string,
        slaType?: string,
        responseDueTime?: Date,
        escalationLevel?: number,
        adminComments?: string,
        userComments?: string,
        internalNotes?: string,
        rootCause?: string,
        resolutionSummary?: string,
        resolvedBy?: number,
        closureRemarks?: string,
        userRating?: number,
        userFeedback?: string
    ) {
        this.id = id;
        this.ticketCode = ticketCode;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeEmail = employeeEmail;
        this.categoryEnum = categoryEnum;
        this.priorityEnum = priorityEnum;
        this.subject = subject;
        this.ticketStatus = ticketStatus;
        this.assignAdminId = assignAdminId;
        this.expectedCompletionDate = expectedCompletionDate;
        this.resolvedAt = resolvedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.slaDeadline = slaDeadline;
        this.timeSpentMinutes = timeSpentMinutes;
        this.description = description;
        this.subCategory = subCategory;
        this.severityEnum = severityEnum;
        this.department = department;
        this.contactNumber = contactNumber;
        this.location = location;
        this.contactEmail = contactEmail;
        this.assignedGroup = assignedGroup;
        this.slaType = slaType;
        this.responseDueTime = responseDueTime;
        this.escalationLevel = escalationLevel;
        this.adminComments = adminComments;
        this.userComments = userComments;
        this.internalNotes = internalNotes;
        this.rootCause = rootCause;
        this.resolutionSummary = resolutionSummary;
        this.resolvedBy = resolvedBy;
        this.closureRemarks = closureRemarks;
        this.userRating = userRating;
        this.userFeedback = userFeedback;
    }
}

// ============================================
// RESPONSE MODELS
// ============================================

export class GetAllTicketsModel extends GlobalResponse {
    tickets: TicketResponseModel[];

    constructor(status: boolean, code: number, message: string, tickets: TicketResponseModel[]) {
        super(status, code, message);
        this.tickets = tickets;
    }
}

export class GetTicketByIdModel extends GlobalResponse {
    ticket: TicketResponseModel;

    constructor(status: boolean, code: number, message: string, ticket: TicketResponseModel) {
        super(status, code, message);
        this.ticket = ticket;
    }
}
