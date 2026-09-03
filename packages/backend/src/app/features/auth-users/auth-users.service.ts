import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUsersRepository } from './repositories/auth-users.repository';
import { AuthTokensRepository } from './repositories/auth-tokens.repository';
import { AuthUsersEntity } from './entities/auth-users.entity';
import { AuthTokensEntity } from './entities/auth-tokens.entity';
import { GenericTransactionManager } from '../../../database/typeorm-transactions';
import { IdRequestModel, DeleteUserModel, GetAllUsersModel, LoginResponseModel, LoginUserModel, LogoutUserModel, RefreshTokenModel, RegisterUserModel, UpdateUserModel, UserResponseModel, UsersResponseModel, UserAccessRequestModel, AccessRequestsListModel, AccessRequestStatus, GlobalResponse } from '@bosvault/shared-models';
import { UserRoleEnum } from '@bosvault/shared-models';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { EmailInfoService } from '../email/email-info.service';
import { ForgotPasswordModel, ResetPasswordModel, RequestAccessModel, SendPasswordResetEmailModel } from '@bosvault/shared-models';
import { Request } from 'express';
import { IUserPayload } from '../../interfaces/auth.interface';
import { ErrorResponse } from '@bosvault/backend-utils';
import { AccessRequestEntity } from '../email/entities/access-request.entity';

const DEFAULT_MENUS = [
    {
        key: 'main',
        label: 'Workspace',
        icon: 'LayoutGrid',
        roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN],
        children: [
            // { key: 'welcome', label: 'Welcome', icon: 'Sparkles', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.USER, UserRoleEnum.VIEWER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN] },
            { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN] },
            { key: 'masters', label: 'Masters', icon: 'Settings2', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN] },
            { key: 'reports', label: 'Reports', icon: 'BarChart3', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN] },
            // { key: 'knowledge-base', label: 'Help Center', icon: 'BookOpen', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.USER, UserRoleEnum.VIEWER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN] }
        ]
    },
    {
        key: 'directory',
        label: 'Directory',
        icon: 'Users',
        roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN],
        children: [
            { key: 'employees', label: 'User Directory', icon: 'Contact', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN] },
            { key: 'slack-users', label: 'Slack Users', icon: 'Slack', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN] },
            { key: 'email-management', label: 'Email Info', icon: 'Mail', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN] },
        ]
    },
    {
        key: 'itam',
        label: 'IT Assets',
        icon: 'Laptop',
        roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN],
        children: [
            { key: 'assets', label: 'Hardware Assets', icon: 'Monitor', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN] },
            { key: 'licenses', label: 'Tools & Subscriptions', icon: 'Key', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN] }
        ]
    },
    {
        key: 'security',
        label: 'Security & Access',
        icon: 'Shield',
        roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN],
        children: [
            { key: 'users-management', label: 'Authentication', icon: 'UserCheck', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN] },
            // { key: 'security-center', label: 'Security Center', icon: 'ShieldAlert', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN] },
            { key: 'credential-vault', label: 'Credential Vault', icon: 'Lock', roles: [UserRoleEnum.ASSET_ADMIN] },

        ]
    },
    {
        key: 'billing',
        label: 'Billing',
        icon: 'CreditCard',
        roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN],
        children: [
            { key: 'payroll', label: 'Payroll Info', icon: 'DollarSign', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER] },
            { key: 'procurement', label: 'Procurement', icon: 'ShoppingCart', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN] }
        ]
    },
    {
        key: 'support',
        label: 'Helpdesk',
        icon: 'HelpCircle',
        roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.USER, UserRoleEnum.VIEWER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN],
        children: [
            { key: 'tickets', label: 'Support Tickets', icon: 'Ticket', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.USER] },
            { key: 'create-ticket', label: 'Create Ticket', icon: 'PlusCircle', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.USER, UserRoleEnum.VIEWER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN] },
            { key: 'knowledge-base', label: 'Help Center', icon: 'BookOpen', roles: [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.USER, UserRoleEnum.VIEWER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN, UserRoleEnum.ASSET_ADMIN] }
        ]
    }
];

@Injectable()
export class AuthUsersService {
    private readonly REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY || (() => {
        throw new Error('JWT_REFRESH_SECRET_KEY must be set in the environment');
    })();

    constructor(
        private dataSource: DataSource,
        private authUsersRepo: AuthUsersRepository,
        private authTokensRepo: AuthTokensRepository,
        @Inject(forwardRef(() => EmailInfoService))
        private emailService: EmailInfoService,
        private jwtService: JwtService,
        @InjectRepository(AccessRequestEntity)
        private accessRequestRepo: Repository<AccessRequestEntity>,
    ) { }

    async registerUser(reqModel: RegisterUserModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource)
        try {
            const existingUser = await this.authUsersRepo.findOne({ where: { email: reqModel.email } })
            if (existingUser) {
                throw new ErrorResponse(0, "Email already exists")
            }

            if (reqModel.email !== 'it@5yinc.com' && !reqModel.companyId) {
                throw new ErrorResponse(0, "Invalid company ID")
            }

            let employeeId: string | null = null;
            if (reqModel.email !== 'it@5yinc.com') {
                // Look up the employees table to find a matching employee by email
                const empRecord = await this.authUsersRepo.findEmployeeByEmailAndCompany(reqModel.email, reqModel.companyId);
                if (!empRecord) {
                    throw new ErrorResponse(0, "Employee not exists")
                }
                employeeId = String(empRecord.id);
            }
            await transManager.startTransaction()
            let finalPassword = reqModel.password;
            if (finalPassword.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(finalPassword)) {
                finalPassword = crypto.createHash('sha256').update(finalPassword).digest('hex');
            }
            const passwordHash = await bcrypt.hash(finalPassword, 10)
            const newUser = new AuthUsersEntity()
            newUser.email = reqModel.email
            newUser.fullName = reqModel.fullName
            newUser.phNumber = reqModel.phNumber
            newUser.companyId = reqModel.companyId
            newUser.passwordHash = passwordHash
            newUser.userRole = reqModel.role || (reqModel.roles && reqModel.roles[0]) || UserRoleEnum.USER
            newUser.roles = reqModel.roles || (reqModel.role ? [reqModel.role] : [UserRoleEnum.USER])
            newUser.status = true
            newUser.employeeId = employeeId
            newUser.passwordChangedAt = new Date()
            await transManager.getRepository(AuthUsersEntity).save(newUser)
            await transManager.getRepository(AccessRequestEntity).update({ email: reqModel.email }, { status: AccessRequestStatus.COMPLETED })
            await transManager.completeTransaction()
            return new GlobalResponse(true, 0, "User Created Successfully")
        } catch (err) {
            await transManager.releaseTransaction()
            throw err
        }
    }

    private generateAccessToken(payload: IUserPayload | object): string {
        return this.jwtService.sign(payload);
    }

    private generateRefreshToken(payload: IUserPayload | object): string {
        return this.jwtService.sign(payload, { secret: this.REFRESH_SECRET_KEY, expiresIn: '7d' });
    }

    async loginUser(reqModel: LoginUserModel, req?: Request): Promise<LoginResponseModel> {
        try {
            const user = await this.authUsersRepo.findOne({ where: { email: reqModel.email } });
            if (!user) {
                throw new ErrorResponse(401, "Invalid credentials");
            }

            // Normalize the incoming password to SHA-256 if it was sent as plain text
            let finalPassword = reqModel.password;
            if (finalPassword.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(finalPassword)) {
                finalPassword = crypto.createHash('sha256').update(finalPassword).digest('hex');
            }

            // Verify Password
            let isMatch = await bcrypt.compare(finalPassword, user.passwordHash);
            if (!isMatch) {
                // Check if stored password hash matches legacy SHA256 of input password
                if (user.passwordHash === finalPassword) {
                    // Update user's password hash in DB to the new format (bcrypt of the SHA256)
                    user.passwordHash = await bcrypt.hash(finalPassword, 10);
                    await this.authUsersRepo.save(user);
                    isMatch = true;
                }

                if (!isMatch) {
                    throw new ErrorResponse(401, "Invalid credentials");
                }
            }

            const userRoles = user.roles || (user.userRole ? [user.userRole] : [UserRoleEnum.USER]);
            const payload = { username: user.email, email: user.email, sub: user.id, companyId: user.companyId, role: user.userRole, roles: userRoles };
            const accessToken = this.generateAccessToken(payload);
            const refreshToken = this.generateRefreshToken({ ...payload, sub: user.id });
            const tokenEntity = new AuthTokensEntity();
            tokenEntity.userId = user.id;
            tokenEntity.token = refreshToken;
            tokenEntity.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await this.authTokensRepo.save(tokenEntity);
            const menus = this.getMenusForRole(userRoles);
            const userInfo = await this.buildUserResponse(user);
            return new LoginResponseModel(true, 0, "User Logged In Successfully", userInfo, accessToken, refreshToken, menus);
        } catch (err) {
            throw err;
        }
    }

    async refreshToken(reqModel: RefreshTokenModel): Promise<LoginResponseModel> {
        try {
            // Verify refresh token signature and expiration
            let decoded: any;
            try {
                decoded = this.jwtService.verify(reqModel.refreshToken, { secret: this.REFRESH_SECRET_KEY });
            } catch (err) {
                throw new ErrorResponse(401, "Invalid or expired refresh token");
            }

            // Check if token exists in DB and is not revoked
            const tokenRecord = await this.authTokensRepo.findOne({ where: { token: reqModel.refreshToken, isRevoked: false } });
            if (!tokenRecord) {
                throw new ErrorResponse(401, "Token has been revoked or is invalid");
            }

            // Get user info
            const user = await this.authUsersRepo.findOne({ where: { id: decoded.sub } });
            if (!user || user.status === false) {
                throw new ErrorResponse(401, "User no longer active");
            }

            const userRoles = user.roles || (user.userRole ? [user.userRole] : [UserRoleEnum.USER]);
            const payload = { username: user.email, email: user.email, sub: user.id, companyId: user.companyId, role: user.userRole, roles: userRoles };
            const newAccessToken = this.generateAccessToken(payload);
            const newRefreshToken = this.generateRefreshToken({ ...payload, sub: user.id });
            // Revoke old token and save new one
            tokenRecord.isRevoked = true;
            await this.authTokensRepo.save(tokenRecord);
            const newTokenEntity = new AuthTokensEntity();
            newTokenEntity.userId = user.id;
            newTokenEntity.token = newRefreshToken;
            newTokenEntity.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await this.authTokensRepo.save(newTokenEntity);
            const userInfo = await this.buildUserResponse(user);
            return new LoginResponseModel(true, 0, "Token Refreshed Successfully", userInfo, newAccessToken, newRefreshToken);
        } catch (err) {
            throw err;
        }
    }

    async verifyPassword(userId: number, password: string): Promise<boolean> {
        try {
            const user = await this.authUsersRepo.findOne({ where: { id: userId } });
            if (!user) {
                throw new ErrorResponse(0, "User not found");
            }
            let finalPassword = password;
            if (finalPassword.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(finalPassword)) {
                finalPassword = crypto.createHash('sha256').update(finalPassword).digest('hex');
            }
            const isMatch = await bcrypt.compare(finalPassword, user.passwordHash);
            return isMatch;
        } catch (error) {
            throw error;
        }
    }


    async requestAccess(reqModel: RequestAccessModel): Promise<GlobalResponse> {
        try {
            // 1. Check if email exists in employees table
            const empRecord = await this.authUsersRepo.findEmployeeByEmail(reqModel.email);
            if (!empRecord) {
                throw new ErrorResponse(0, "Your email is not registered in our employee directory. Please contact HR.");
            }

            // 2. Check if a login account already exists
            const existingUser = await this.authUsersRepo.findOne({ where: { email: reqModel.email } });
            if (existingUser) {
                throw new ErrorResponse(0, "A login account already exists for this email. Please try logging in.");
            }

            // 3. Check if an access request is already pending
            const pendingRequest = await this.accessRequestRepo.findOne({
                where: { email: reqModel.email, status: AccessRequestStatus.PENDING }
            });
            if (pendingRequest) {
                throw new ErrorResponse(0, "An access request for this email has already been raised and is pending review.");
            }

            const entity = new AccessRequestEntity();
            entity.name = reqModel.name;
            entity.email = reqModel.email;
            entity.description = reqModel.description;
            entity.status = AccessRequestStatus.PENDING;
            await this.accessRequestRepo.save(entity);
            await this.emailService.sendAccessRequestEmail(reqModel);
            return new GlobalResponse(true, 0, "Access request sent successfully");
        } catch (error) {
            throw error;
        }
    }

    async getAccessRequests(): Promise<AccessRequestsListModel> {
        try {
            const requests = await this.accessRequestRepo.find({ order: { createdAt: 'DESC' } });
            const formatted = requests.map(r => new UserAccessRequestModel(
                r.id, r.name, r.email, r.description, r.status, r.createdAt
            ));
            return new AccessRequestsListModel(true, 0, 'Access requests retrieved', formatted);
        } catch (error) {
            throw error;
        }
    }

    async closeAccessRequest(id: number): Promise<GlobalResponse> {
        try {
            const entity = await this.accessRequestRepo.findOne({ where: { id } });
            if (!entity) {
                throw new ErrorResponse(0, 'Access request not found');
            }
            entity.status = AccessRequestStatus.COMPLETED;
            await this.accessRequestRepo.save(entity);
            return new GlobalResponse(true, 0, 'Access request closed');
        } catch (error) {
            throw error;
        }
    }

    async deleteAccessRequest(id: number): Promise<GlobalResponse> {
        try {
            const entity = await this.accessRequestRepo.findOne({ where: { id } });
            if (!entity) {
                throw new ErrorResponse(0, 'Access request not found');
            }
            await this.accessRequestRepo.delete(id);
            return new GlobalResponse(true, 0, 'Access request deleted successfully');
        } catch (error) {
            throw error;
        }
    }

    async logOutUser(reqModel: LogoutUserModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existingUser = await this.authUsersRepo.findOne({ where: { email: reqModel.email } });
            if (!existingUser) {
                throw new ErrorResponse(0, "Email does not exist");
            }
            await transManager.startTransaction();
            // Revoke all tokens for this user on logout
            await this.authTokensRepo.revokeAllTokensForUser(existingUser.id);
            await this.authUsersRepo.update({ email: reqModel.email }, { lastLogin: new Date() })
            await transManager.completeTransaction();
            return new GlobalResponse(true, 0, "User Logged Out Successfully");
        } catch (err) {
            await transManager.releaseTransaction();
            throw err;
        }
    }

    async updateUser(reqModel: UpdateUserModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            let existingUser;
            if (reqModel.id) {
                existingUser = await this.authUsersRepo.findOne({ where: { id: reqModel.id } });
            } else if (reqModel.email) {
                existingUser = await this.authUsersRepo.findOne({ where: { email: reqModel.email } });
            }

            if (!existingUser) {
                throw new ErrorResponse(0, "User does not exist");
            }

            await transManager.startTransaction();

            const updateData: Partial<AuthUsersEntity> = {};
            updateData.fullName = reqModel.fullName;
            updateData.phNumber = reqModel.phNumber;
            if (reqModel.role || reqModel.roles) {
                updateData.userRole = (reqModel.role || (reqModel.roles && reqModel.roles[0])) as any;
                updateData.roles = reqModel.roles || (reqModel.role ? [reqModel.role] : undefined);
            }
            updateData.companyId = reqModel.companyId;
            updateData.email = reqModel.email;
            if (reqModel.password) {
                let finalPassword = reqModel.password;
                if (finalPassword.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(finalPassword)) {
                    finalPassword = crypto.createHash('sha256').update(finalPassword).digest('hex');
                }
                updateData.passwordHash = await bcrypt.hash(finalPassword, 10);
            }

            await transManager.getRepository(AuthUsersEntity).update({ id: existingUser.id }, updateData);

            await transManager.completeTransaction();
            return new GlobalResponse(true, 0, "User Updated Successfully");
        } catch (err) {
            await transManager.releaseTransaction();
            throw err;
        }
    }

    async deleteUser(reqModel: DeleteUserModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existingUser = await this.authUsersRepo.findOne({ where: { email: reqModel.email } });
            if (!existingUser) {
                throw new ErrorResponse(0, "Email does not exist");
            }
            await transManager.startTransaction();
            await this.authUsersRepo.delete({ email: reqModel.email })
            await transManager.completeTransaction();
            return new GlobalResponse(true, 0, "User Deleted Successfully");
        } catch (err) {
            await transManager.releaseTransaction();
            throw err;
        }
    }

    async getAllUsers(reqModel: IdRequestModel): Promise<GetAllUsersModel> {
        try {
            const users = await this.authUsersRepo.find({ where: { companyId: reqModel.id } });
            if (!users || users.length === 0) {
                // Return empty list instead of throwing error if that's preferred, but sticking to previous logic of error for now but with correct check
                // Actually returning empty list is usually better for "getAll", but the previous code threw error. 
                // "No users found" with code 0.
                // I will keep the throw but fix the check.
                throw new ErrorResponse(0, "No users found");
            }

            const formattedUsers = users.map(user => {
                const userRoles = user.roles || (user.userRole ? [user.userRole] : [UserRoleEnum.USER]);
                return new UsersResponseModel(user.id, user.fullName, user.email, user.phNumber, user.companyId, user.userRole, user.status, user.lastLogin, userRoles, user.createdAt, user.updatedAt);
            });
            return new GetAllUsersModel(true, 0, "Users Retrieved Successfully", formattedUsers);
        } catch (err) {
            throw err;
        }
    }


    async forgotPassword(model: ForgotPasswordModel): Promise<GlobalResponse> {
        try {
            const user = await this.authUsersRepo.findOne({ where: { email: model.email } });
            if (!user) {
                // Security best practice
                return new GlobalResponse(true, 200, "If an account exists with this email, a reset instructions have been sent.");
            }

            const token = crypto.randomBytes(32).toString('hex');
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + 1);

            user.resetToken = token;
            user.resetTokenExpiry = expiry;
            await this.authUsersRepo.save(user);

            // Send Reset Email
            const success = await this.emailService.sendPasswordResetEmail(new SendPasswordResetEmailModel(user.email, token));
            if (!success) {
                throw new ErrorResponse(0, "Failed to send password reset email. Please try again later.");
            }

            return new GlobalResponse(true, 200, "Password reset instructions sent.");
        } catch (error) {
            throw error;
        }
    }

    async resetPassword(model: ResetPasswordModel): Promise<GlobalResponse> {
        try {
            const user = await this.authUsersRepo.findOne({
                where: {
                    email: model.email
                }
            });

            if (!user) {
                throw new ErrorResponse(400, "User email not found.");
            }

            let finalPassword = model.newPassword;
            if (finalPassword.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(finalPassword)) {
                finalPassword = crypto.createHash('sha256').update(finalPassword).digest('hex');
            }
            user.passwordHash = await bcrypt.hash(finalPassword, 10);
            // Optionally clear reset token fields if they were used in a mixed flow, though not strictly necessary here
            user.resetToken = null;
            user.resetTokenExpiry = null;
            user.passwordChangedAt = new Date();
            await this.authUsersRepo.save(user);

            return new GlobalResponse(true, 200, "Password has been reset successfully.");
        } catch (error) {
            throw error;
        }
    }

    async validateGoogleUser(googleProfile: any): Promise<AuthUsersEntity> {
        const { googleId, email, firstName, lastName, picture } = googleProfile;

        let user = await this.authUsersRepo.findOne({ where: [{ googleId }, { email }] });

        if (!user) {
            user = new AuthUsersEntity();
            user.email = email;
            user.fullName = `${firstName} ${lastName}`;
            user.googleId = googleId;
            user.picture = picture;
            user.status = true;
            user.userRole = UserRoleEnum.USER;
            user.employeeId = `EMP-G-${Date.now()}`;
            await this.authUsersRepo.save(user);
        } else {
            let changed = false;
            if (!user.googleId) {
                user.googleId = googleId;
                changed = true;
            }
            if (!user.picture) {
                user.picture = picture;
                changed = true;
            }
            if (changed) {
                await this.authUsersRepo.save(user);
            }
        }

        return user;
    }

    async loginUserFromOAuth(user: AuthUsersEntity): Promise<LoginResponseModel> {
        const userRoles = user.roles || (user.userRole ? [user.userRole] : [UserRoleEnum.USER]);
        const payload = { username: user.email, email: user.email, sub: user.id, companyId: user.companyId, role: user.userRole, roles: userRoles };
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken({ ...payload, sub: user.id });
        const tokenEntity = new AuthTokensEntity();
        tokenEntity.userId = user.id;
        tokenEntity.token = refreshToken;
        tokenEntity.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.authTokensRepo.save(tokenEntity);
        const menus = this.getMenusForRole(userRoles);
        const userInfo = await this.buildUserResponse(user);
        return new LoginResponseModel(true, 0, "User Logged In via OAuth Successfully", userInfo, accessToken, refreshToken, menus);
    }

    async getUserById(userId: number): Promise<AuthUsersEntity> {
        return await this.authUsersRepo.findOne({ where: { id: userId } });
    }

    async getMe(userId: number): Promise<LoginResponseModel> {
        try {
            const user = await this.authUsersRepo.findOne({ where: { id: userId } });
            if (!user) {
                throw new ErrorResponse(404, "User not found");
            }

            const userRoles = user.roles || (user.userRole ? [user.userRole] : [UserRoleEnum.USER]);
            const menus = this.getMenusForRole(userRoles);
            const userInfo = await this.buildUserResponse(user);

            return new LoginResponseModel(true, 0, "Profile retrieved successfully", userInfo, undefined, undefined, menus);
        } catch (error) {
            throw error;
        }
    }


    private getMenusForRole(roleOrRoles: string | string[]): any[] {
        const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
        const isSuperOrSite = roles.includes(UserRoleEnum.SUPER_ADMIN) || roles.includes(UserRoleEnum.SITE_ADMIN);

        const filterAndMapMenus = (menus: any[]): any[] => {
            return menus
                .filter(m => {
                    if (m.key === 'credential-vault') {
                        return roles.includes(UserRoleEnum.ASSET_ADMIN);
                    }
                    if (isSuperOrSite) {
                        return true;
                    }
                    return m.roles.some((r: any) => roles.includes(r));
                })
                .map(m => {
                    const children = m.children ? filterAndMapMenus(m.children) : undefined;

                    let permissions;
                    if (isSuperOrSite) {
                        permissions = { create: true, read: true, update: true, delete: true, scopes: ['*'] };
                    } else {
                        const hasWriteAccess = roles.includes(UserRoleEnum.ADMIN) || roles.includes(UserRoleEnum.ASSET_ADMIN);
                        permissions = hasWriteAccess
                            ? { create: true, read: true, update: true, delete: true }
                            : { create: false, read: true, update: false, delete: false };
                    }

                    return { ...m, permissions, children };
                });
        };

        return filterAndMapMenus(DEFAULT_MENUS);
    }

    private async buildUserResponse(user: AuthUsersEntity): Promise<UserResponseModel> {
        let department = 'Engineering Support';
        if (user.employeeId) {
            try {
                const deptName = await this.authUsersRepo.getEmployeeDepartmentName(parseInt(user.employeeId));
                if (deptName) {
                    department = deptName;
                }
            } catch (e) {
                console.error("Failed to query user department:", e);
            }
        }
        const userRoles = user.roles || (user.userRole ? [user.userRole] : [UserRoleEnum.USER]);
        return new UserResponseModel(user.id, user.fullName, user.companyId, user.email, user.phNumber || '', user.userRole, department, user.createdAt, userRoles);
    }
}
