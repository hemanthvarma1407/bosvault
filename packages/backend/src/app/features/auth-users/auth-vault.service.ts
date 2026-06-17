import { Injectable, Inject, forwardRef } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthUsersRepository } from './repositories/auth-users.repository';
import { EmailInfoService } from '../email/email-info.service';
import { ErrorResponse } from '@bosvault/backend-utils';
import { GlobalResponse } from '@bosvault/shared-models';

@Injectable()
export class AuthVaultService {
    constructor(
        private authUsersRepo: AuthUsersRepository,
        @Inject(forwardRef(() => EmailInfoService))
        private emailService: EmailInfoService,
    ) {}

    async setVaultPassword(userId: number, password: string, otp: string): Promise<void> {
        try {
            const user = await this.authUsersRepo.findOne({ where: { id: userId } });
            if (!user) {
                throw new ErrorResponse(0, "User not found");
            }
            if (!otp) {
                throw new ErrorResponse(0, "OTP is required to set vault password");
            }
            if (!user.vaultResetOtp || user.vaultResetOtp !== otp) {
                throw new ErrorResponse(0, "Invalid OTP");
            }
            if (!user.vaultResetOtpExpiry || user.vaultResetOtpExpiry < new Date()) {
                throw new ErrorResponse(0, "OTP has expired");
            }

            user.vaultPasswordHash = await bcrypt.hash(password, 10);
            user.vaultResetOtp = null;
            user.vaultResetOtpExpiry = null;
            await this.authUsersRepo.save(user);
        } catch (error) {
            throw error;
        }
    }

    async verifyVaultPassword(userId: number, password: string): Promise<boolean> {
        try {
            const user = await this.authUsersRepo.findOne({ where: { id: userId } });
            if (!user) {
                throw new ErrorResponse(0, "User not found");
            }
            if (!user.vaultPasswordHash) {
                return false;
            }
            const isMatch = await bcrypt.compare(password, user.vaultPasswordHash);
            return isMatch;
        } catch (error) {
            throw error;
        }
    }

    async requestVaultReset(email: string): Promise<GlobalResponse> {
        try {
            const user = await this.authUsersRepo.findOne({ where: { email } });
            if (!user) {
                return new GlobalResponse(true, 0, "If your account is registered, you will receive an OTP shortly.");
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + 10);

            user.vaultResetOtp = otp;
            user.vaultResetOtpExpiry = expiry;
            await this.authUsersRepo.save(user);

            const success = await this.emailService.sendVaultOtpEmail(user.email, otp);
            if (!success) {
                throw new ErrorResponse(0, "Failed to send OTP email. Please try again later.");
            }

            return new GlobalResponse(true, 0, "OTP has been sent to your registered email.");
        } catch (error) {
            throw error;
        }
    }

    async resetVaultPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<GlobalResponse> {
        try {
            const user = await this.authUsersRepo.findOne({ where: { email } });
            if (!user) {
                throw new ErrorResponse(0, "User not found");
            }

            if (!user.vaultResetOtp || user.vaultResetOtp !== otp) {
                throw new ErrorResponse(0, "Invalid OTP");
            }

            if (!user.vaultResetOtpExpiry || user.vaultResetOtpExpiry < new Date()) {
                throw new ErrorResponse(0, "OTP has expired");
            }

            user.vaultPasswordHash = await bcrypt.hash(newPassword, 10);
            user.vaultResetOtp = null;
            user.vaultResetOtpExpiry = null;
            await this.authUsersRepo.save(user);

            return new GlobalResponse(true, 0, "Vault security key has been reset successfully.");
        } catch (error) {
            throw error;
        }
    }
}
