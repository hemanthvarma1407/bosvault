import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('company_info')
export class CompanyInfoEntity {

  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id', nullable: true })
  userId: number;

  @Column('varchar', { name: 'company_name', length: 255, nullable: false, comment: 'Name of the company' })
  companyName: string;

  @Column('varchar', { name: 'location', length: 255, nullable: false, comment: 'Company location' })
  location: string;

  @Column('varchar', { name: 'est_date', nullable: false, comment: 'Company establishment date' })
  estDate: Date;

  @Column('varchar', { name: 'email', length: 255, nullable: true, comment: 'Company email' })
  email: string;

  @Column('varchar', { name: 'phone', length: 50, nullable: true, comment: 'Company phone number' })
  phone: string;

  @Column('varchar', { name: 'slack_bot_token', length: 255, nullable: true, comment: 'Slack Bot Token for this company' })
  slackBotToken: string;

  @Column('varchar', { name: 'slack_workspace_id', length: 100, nullable: true, comment: 'Slack Workspace ID for this company' })
  slackWorkspaceId: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
