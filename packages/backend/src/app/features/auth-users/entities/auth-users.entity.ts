import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRoleEnum } from '@bosvault/shared-models';

@Entity('auth_users')
export class AuthUsersEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: 'Primary key for auth users' })
  id: number;

  @Column('varchar', { name: 'full_name', length: 255, nullable: false, comment: 'Full name of the user' })
  fullName: string;

  @Column('bigint', { name: 'company_id', nullable: false, comment: 'Reference to company_info table' })
  companyId: number;

  @Column('varchar', { name: 'employee_id', length: 255, nullable: true, unique: true, comment: 'User employee id' })
  employeeId: string | null;

  @Column('varchar', { name: 'email', length: 255, nullable: false, unique: true, comment: 'User email address' })
  email: string;

  @Column('varchar', { name: 'ph_number', length: 50, nullable: true, comment: 'Phone number' })
  phNumber: string;

  @Column('text', { name: 'password_hash', nullable: true, comment: 'Hashed password' })
  passwordHash: string;

  @Column('text', { name: 'vault_password_hash', nullable: true, comment: 'Hashed vault password' })
  vaultPasswordHash: string;

  @Column('varchar', { name: 'google_id', length: 255, nullable: true, comment: 'Google ID for OAuth' })
  googleId: string;

  @Column('text', { name: 'picture', nullable: true, comment: 'User profile picture URL' })
  picture: string;

  @Column('enum', { name: 'user_role', enum: UserRoleEnum, default: UserRoleEnum.USER, nullable: false, comment: 'Legacy user role' })
  userRole: UserRoleEnum;

  @Column('boolean', { name: 'status', default: true, nullable: false, comment: 'User active status' })
  status: boolean;

  @Column('timestamp', { name: 'last_login', nullable: true, comment: 'Last login timestamp' })
  lastLogin: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Record creation timestamp' })
  createdAt: Date;

  @Column('varchar', { name: 'reset_token', length: 255, nullable: true, comment: 'Token for password reset' })
  resetToken: string;

  @Column('timestamp', { name: 'reset_token_expiry', nullable: true, comment: 'Expiry for reset token' })
  resetTokenExpiry: Date;

  @Column('timestamp', { name: 'password_changed_at', nullable: true, comment: 'Timestamp of last password change' })
  passwordChangedAt: Date;

  @Column('varchar', { name: 'vault_reset_otp', length: 10, nullable: true, comment: 'OTP for vault password reset' })
  vaultResetOtp: string;

  @Column('timestamp', { name: 'vault_reset_otp_expiry', nullable: true, comment: 'Expiry for vault reset OTP' })
  vaultResetOtpExpiry: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', comment: 'Record last update timestamp' })
  updatedAt: Date;
}
