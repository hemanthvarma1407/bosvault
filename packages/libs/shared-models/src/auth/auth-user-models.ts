import { GlobalResponse } from '../common/global-response';
import { UserRoleEnum } from '../enums';

export class RegisterUserModel {
    fullName: string;
    companyId: number;
    email: string;
    phNumber: string;
    password: string;
    role?: UserRoleEnum;
    roles?: UserRoleEnum[];

    constructor(fullName: string, companyId: number, email: string, phNumber: string, password: string, role?: UserRoleEnum, roles?: UserRoleEnum[]) {
        this.fullName = fullName;
        this.companyId = companyId;
        this.email = email;
        this.phNumber = phNumber;
        this.password = password;
        this.role = role;
        this.roles = roles;
    }
}

export class UpdateUserModel {
    id: number;
    fullName?: string;
    companyId?: number;
    email?: string;
    phNumber?: string;
    password?: string;
    role?: UserRoleEnum;
    roles?: UserRoleEnum[];

    constructor(id: number, fullName?: string, companyId?: number, email?: string, phNumber?: string, password?: string, role?: UserRoleEnum, roles?: UserRoleEnum[]) {
        this.id = id;
        this.fullName = fullName;
        this.companyId = companyId;
        this.email = email;
        this.phNumber = phNumber;
        this.password = password;
        this.role = role;
        this.roles = roles;
    }
}

export class DeleteUserModel {
    email: string;
    constructor(email: string) {
        this.email = email;
    }
}

export class LoginUserModel {
    email: string;
    password: string;
    latitude?: number;
    longitude?: number;

    constructor(email: string, password: string, latitude?: number, longitude?: number) {
        this.email = email;
        this.password = password;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}

export class ForgotPasswordModel {
    email: string;
    constructor(email: string) {
        this.email = email;
    }
}

export class LogoutUserModel {
    email: string;
    token: string;

    constructor(email: string, token: string) {
        this.email = email;
        this.token = token;
    }
}

export class ResetPasswordModel {
    email: string;
    newPassword: string;

    constructor(email: string, newPassword: string) {
        this.email = email;
        this.newPassword = newPassword;
    }
}



export class RefreshTokenModel {
    refreshToken: string;
    constructor(refreshToken: string) {
        this.refreshToken = refreshToken;
    }
}



export class UserResponseModel {
    id: number;
    fullName: string;
    companyId: number;
    email: string;
    phNumber: string;
    role: UserRoleEnum;
    department?: string;
    createdAt?: Date;
    roles?: UserRoleEnum[];

    constructor(id: number, fullName: string, companyId: number, email: string, phNumber: string, role: UserRoleEnum, department?: string, createdAt?: Date, roles?: UserRoleEnum[]) {
        this.id = id;
        this.fullName = fullName;
        this.companyId = companyId;
        this.email = email;
        this.phNumber = phNumber;
        this.role = role;
        this.department = department;
        this.createdAt = createdAt;
        this.roles = roles;
    }
}

export class LoginResponseModel extends GlobalResponse {
    userInfo: UserResponseModel
    accessToken: string;
    refreshToken: string;
    menus?: any[];
    constructor(status: boolean, code: number, message: string, userInfo: UserResponseModel, accessToken: string, refreshToken: string, menus?: any[]) {
        super(status, code, message);
        this.userInfo = userInfo;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.menus = menus;
    }
}

export class GetAllUsersModel extends GlobalResponse {
    users: UsersResponseModel[]
    constructor(status: boolean, code: number, message: string, users: UsersResponseModel[]) {
        super(status, code, message);
        this.users = users;
    }
}

export class UsersResponseModel {
    id: number;
    fullName: string;
    email: string;
    phNumber?: string;
    companyId: number;
    userRole: string;
    status: boolean;
    lastLogin?: Date;
    roles?: UserRoleEnum[];
    createdAt: Date;
    updatedAt: Date;
    constructor(id: number, fullName: string, email: string, phNumber: string, companyId: number, userRole: string, status: boolean, lastLogin: Date, roles: UserRoleEnum[], createdAt: Date, updatedAt: Date) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phNumber = phNumber;
        this.companyId = companyId;
        this.userRole = userRole;
        this.status = status;
        this.lastLogin = lastLogin;
        this.roles = roles;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

export class UserAccessRequestModel {
    id: number;
    name: string;
    email: string;
    description?: string;
    status: string;
    createdAt: Date;

    constructor(id: number, name: string, email: string, description: string, status: string, createdAt: Date) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
    }
}

export class AccessRequestsListModel extends GlobalResponse {
    requests: UserAccessRequestModel[];
    constructor(status: boolean, code: number, message: string, requests: UserAccessRequestModel[]) {
        super(status, code, message);
        this.requests = requests;
    }
}

export class RequestAccessModel {
    name: string;
    email: string;
    description?: string;
    status?: string;

    constructor(name: string, email: string, description?: string, status?: string) {
        this.name = name;
        this.email = email;
        this.description = description;
        this.status = status;
    }
}
