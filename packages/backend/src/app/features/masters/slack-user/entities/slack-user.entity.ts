import { Column, Entity } from 'typeorm';
import { MasterBaseEntity } from '../../../../../database/master-base.entity';

@Entity('slack_users')
export class SlackUsersMasterEntity extends MasterBaseEntity {
    @Column('varchar', { name: 'name', length: 255, nullable: false, comment: 'User full name' })
    name: string;

    @Column('varchar', { name: 'email', length: 255, nullable: true, comment: 'User email' })
    email: string;

    @Column('varchar', { name: 'slack_user_id', length: 50, nullable: true, comment: 'Slack User ID (e.g. U1234567)' })
    slackUserId: string;

    @Column('varchar', { name: 'team_id', length: 50, nullable: true, comment: 'Slack Team/Workspace ID' })
    teamId: string;

    @Column('varchar', { name: 'display_name', length: 255, nullable: true, comment: 'Slack Display Name' })
    displayName: string;

    @Column('varchar', { name: 'avatar_url', length: 500, nullable: true, comment: 'Slack Avatar URL' })
    avatarUrl: string;

    @Column('varchar', { name: 'role', length: 100, nullable: true, comment: 'User Role/Title' })
    role: string;

    @Column('varchar', { name: 'phone', length: 50, nullable: true, comment: 'Phone Number' })
    phone: string;

    @Column('varchar', { name: 'timezone', length: 100, nullable: true, comment: 'User Timezone' })
    timezone: string;

    @Column('varchar', { name: 'timezone_label', length: 100, nullable: true, comment: 'User Timezone Label' })
    timezoneLabel: string;

    @Column('boolean', { name: 'is_admin', nullable: true, default: false, comment: 'Whether user is a workspace admin' })
    isAdmin: boolean;

    @Column('boolean', { name: 'is_active', nullable: false, default: true, comment: 'Whether user is active' })
    isActive: boolean;

    @Column('bigint', { name: 'company_id', nullable: false, comment: 'Company ID Reference' })
    companyId: number;

    @Column('bigint', { name: 'employee_id', nullable: true, comment: 'Linked Employee ID' })
    employeeId: number;

    @Column('boolean', { name: 'is_guest', nullable: true, default: false, comment: 'Whether user is a Slack guest account' })
    isGuest: boolean;

    @Column('boolean', { name: 'is_ultra_restricted', nullable: true, default: false, comment: 'Single-channel guest' })
    isUltraRestricted: boolean;

    @Column('boolean', { name: 'is_restricted', nullable: true, default: false, comment: 'Multi-channel or restricted guest' })
    isRestricted: boolean;

    @Column('boolean', { name: 'is_stranger', nullable: true, default: false, comment: 'External / Slack Connect user' })
    isStranger: boolean;

    @Column('varchar', { name: 'user_type', length: 50, nullable: true, default: 'Member', comment: 'User type: Member, Multi-Channel Guest, Single-Channel Guest, External, Bot' })
    userType: string;

    @Column('boolean', { name: 'is_billable', nullable: true, default: true, comment: 'Whether user is billable under workspace billing' })
    isBillable: boolean;
}
