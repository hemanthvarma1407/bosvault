import { IsNumber, IsNotEmpty } from 'class-validator';

export class IdRequestModel {
    @IsNumber()
    @IsNotEmpty()
    id: number;
    constructor(id: number) {
        this.id = id;
    }
}

export class CommonRequestModel {
    username: string;
    userId: number;
    ipAddress: string;
    companyId?: number;
    constructor(username: string, userId: number, ipAddress: string, companyId?: number) {
        this.username = username;
        this.userId = userId;
        this.ipAddress = ipAddress;
        this.companyId = companyId;
    }
}