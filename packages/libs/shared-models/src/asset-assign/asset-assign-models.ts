import { GlobalResponse } from '../common/global-response';

export class CreateAssetAssignModel {
    assetId: number;
    employeeId: number;
    assignedById: number;
    assignedDate: Date;
    returnDate?: Date;
    remarks?: string;

    constructor(
        assetId: number,
        employeeId: number,
        assignedById: number,
        assignedDate: Date,
        returnDate?: Date,
        remarks?: string
    ) {
        this.assetId = assetId;
        this.employeeId = employeeId;
        this.assignedById = assignedById;
        this.assignedDate = assignedDate;
        this.returnDate = returnDate;
        this.remarks = remarks;
    }
}

export class UpdateAssetAssignModel extends CreateAssetAssignModel {
    id: number;

    constructor(
        id: number,
        assetId: number,
        employeeId: number,
        assignedById: number,
        assignedDate: Date,
        returnDate?: Date,
        remarks?: string
    ) {
        super(assetId, employeeId, assignedById, assignedDate, returnDate, remarks);
        this.id = id;
    }
}

export class GetAssetAssignModel {
    id: number;
    constructor(id: number) {
        this.id = id;
    }
}

export class AssetAssignResponseModel {
    id: number;
    assetId: number;
    employeeId: number;
    assignedById: number;
    assignedDate: Date;
    returnDate?: Date;
    remarks?: string;

    constructor(
        id: number,
        assetId: number,
        employeeId: number,
        assignedById: number,
        assignedDate: Date,
        returnDate?: Date,
        remarks?: string
    ) {
        this.id = id;
        this.assetId = assetId;
        this.employeeId = employeeId;
        this.assignedById = assignedById;
        this.assignedDate = assignedDate;
        this.returnDate = returnDate;
        this.remarks = remarks;
    }
}

export class GetAllAssetAssignsModel extends GlobalResponse {
    assignments: AssetAssignResponseModel[];
    constructor(status: boolean, code: number, message: string, assignments: AssetAssignResponseModel[]) {
        super(status, code, message);
        this.assignments = assignments;
    }
}

export class GetAssetAssignByIdModel extends GlobalResponse {
    assignment: AssetAssignResponseModel;
    constructor(status: boolean, code: number, message: string, assignment: AssetAssignResponseModel) {
        super(status, code, message);
        this.assignment = assignment;
    }
}
