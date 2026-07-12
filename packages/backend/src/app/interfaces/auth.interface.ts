import { Request } from 'express';

export interface IUserPayload {
    userId: number;
    email: string;
    companyId: number;
    role: string;
    roles?: string[];
}

export interface IAuthenticatedRequest extends Request {
    user: IUserPayload;
}
