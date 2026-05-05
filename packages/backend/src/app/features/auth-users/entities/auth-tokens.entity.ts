import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('auth_tokens')
export class AuthTokensEntity {
    @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: 'Primary key for auth tokens' })
    id: number;

    @Column('bigint', { name: 'user_id', nullable: false, comment: 'Reference to auth_users table' })
    userId: number;

    @Column('varchar', { name: 'token', length: 512, nullable: false, comment: 'Hashed or plain refresh token' })
    token: string;

    @Column('timestamp', { name: 'expires_at', nullable: false, comment: 'Token expiration timestamp' })
    expiresAt: Date;

    @Column('boolean', { name: 'is_revoked', default: false, nullable: false, comment: 'Whether the token is revoked' })
    isRevoked: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp', comment: 'Token generation timestamp' })
    createdAt: Date;
}
