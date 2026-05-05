import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { SlackUsersRepository } from './repositories/slack-user.repository';
import { EmployeesRepository } from '../../employees/repositories/employees.repository';
import { GlobalResponse, ErrorResponse } from '@bosvault/backend-utils';
import { CreateSlackUserModel, UpdateSlackUserModel, GetAllSlackUsersResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { SlackUsersMasterEntity } from './entities/slack-user.entity';
import { EmployeesEntity } from '../../employees/entities/employees.entity';
import { GenericTransactionManager } from '../../../../database/typeorm-transactions';
import { CompanyInfoRepository } from '../company-info/repositories/company-info.repository';
import { CompanyInfoEntity } from '../company-info/entities/company-info.entity';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SlackUserService {
    private readonly logger = new Logger(SlackUserService.name);

    constructor(
        private dataSource: DataSource,
        private slackUserRepo: SlackUsersRepository,
        private employeeRepo: EmployeesRepository,
        private companyRepo: CompanyInfoRepository
    ) { }


    async importSlackUsers(companyId: number): Promise<GlobalResponse> {
        this.logger.log(`Importing users for Company ID: ${companyId}`);
        let slackToken = '';

        // Fetch company-specific token mandatory
        const companyIdNum = Number(companyId);
        if (companyIdNum) {
            const companyInfo = await this.companyRepo.findOne({ where: { id: companyIdNum } });
            if (companyInfo) {
                if (companyInfo.slackBotToken && companyInfo.slackBotToken.trim() !== '') {
                    slackToken = companyInfo.slackBotToken;
                    this.logger.log(`Using company-specific token from Database: ${companyInfo.companyName}`);
                } else {
                    const errorMsg = `Slack Bot Token is not configured for company "${companyInfo.companyName}". Please set it in the Company Master settings.`;
                    this.logger.error(errorMsg);
                    throw new ErrorResponse(400, errorMsg);
                }
            } else {
                throw new ErrorResponse(404, `Company with ID ${companyIdNum} not found`);
            }
        } else {
            throw new ErrorResponse(400, `A valid Company ID is required for Slack import`);
        }

        const client = new WebClient(slackToken);
        let allMembers: any[] = [];
        let cursor: string | undefined;

        // Paginate through all Slack workspace members
        do {
            const response = await client.users.list({ cursor, limit: 200 });
            console.log("response", response);
            if (!response.ok) {
                throw new ErrorResponse(502, 'Failed to fetch users from Slack API');
            }
            const members = response.members || [];
            allMembers = allMembers.concat(members);
            cursor = response.response_metadata?.next_cursor;
        } while (cursor);

        // Filter out bots, deleted accounts, and slackbot
        const realUsers = allMembers.filter(m => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT');

        let imported = 0;
        let updated = 0;

        for (const member of realUsers) {
            const profile = member.profile || {};
            const email = profile.email || '';
            const name = profile.real_name || member.real_name || member.name || email || member.id;
            const displayName = profile.display_name || profile.display_name_normalized || member.name || '';
            const avatarUrl = profile.image_192 || profile.image_72 || profile.image_48 || '';
            const teamId = member.team_id || '';
            const timezone = member.tz || '';
            const timezoneLabel = member.tz_label || '';
            const isAdmin = member.is_admin || false;

            // Try to find matching employee by email to auto-link and update their Slack info
            let matchedEmployeeId: number | undefined = undefined;
            let matchedEmp: EmployeesEntity | null = null;
            if (email && email.trim() !== '') {
                matchedEmp = await this.employeeRepo.findOne({
                    where: { email: email.trim(), companyId: Number(companyId) }
                });
                if (matchedEmp) {
                    matchedEmployeeId = Number(matchedEmp.id);
                    // Sync Slack info to Employee table immediately
                    matchedEmp.slackUserId = member.id;
                    matchedEmp.slackDisplayName = displayName || matchedEmp.slackDisplayName;
                    matchedEmp.slackAvatar = avatarUrl || matchedEmp.slackAvatar;
                    matchedEmp.slackIsAdmin = isAdmin;
                    matchedEmp.slackTimezone = timezone;
                    matchedEmp.slackTeamId = teamId;
                    matchedEmp.isSlackActive = true;
                    await this.employeeRepo.save(matchedEmp);
                }
            }

            const existingUser = await this.slackUserRepo.findOne({ where: { slackUserId: member.id } });

            if (existingUser) {
                existingUser.name = name || existingUser.name;
                existingUser.email = email || existingUser.email;
                existingUser.displayName = displayName || existingUser.displayName;
                existingUser.role = profile.title || existingUser.role;
                existingUser.phone = profile.phone || existingUser.phone;
                existingUser.avatarUrl = avatarUrl || existingUser.avatarUrl;
                existingUser.teamId = teamId || existingUser.teamId;
                existingUser.timezone = timezone || existingUser.timezone;
                existingUser.timezoneLabel = timezoneLabel || existingUser.timezoneLabel;
                existingUser.isAdmin = isAdmin;
                existingUser.isActive = true;
                if (!existingUser.employeeId && matchedEmployeeId) {
                    existingUser.employeeId = matchedEmployeeId;
                }
                await this.slackUserRepo.save(existingUser);
                updated++;
            } else {
                const newEntity = new SlackUsersMasterEntity();
                newEntity.companyId = companyId;
                newEntity.slackUserId = member.id;
                newEntity.teamId = teamId;
                newEntity.name = name;
                newEntity.email = email;
                newEntity.displayName = displayName;
                newEntity.avatarUrl = avatarUrl;
                newEntity.role = profile.title || '';
                newEntity.phone = profile.phone || '';
                newEntity.timezone = timezone;
                newEntity.timezoneLabel = timezoneLabel;
                newEntity.isAdmin = isAdmin;
                newEntity.isActive = true;
                newEntity.employeeId = matchedEmployeeId;
                await this.slackUserRepo.save(newEntity);
                imported++;
            }
        }

        return new GlobalResponse(true, 200, `Slack import complete: ${imported} new users imported, ${updated} users updated.`);
    }

    async createSlackUser(reqModel: CreateSlackUserModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {

            const companyInfo = await this.companyRepo.findOne({ where: { id: reqModel.id } });
            if (!companyInfo)
                throw new ErrorResponse(400, 'Invalid Company ID or Company does not exist');

            const empInfo = await this.employeeRepo.findOne({ where: { id: reqModel.employeeId, companyId: reqModel.id } });
            if (!empInfo) {
                throw new ErrorResponse(400, 'Invalid Employee ID or Employee does not belong to the Company');
            }

            await transManager.startTransaction();
            const saveEntity = new SlackUsersMasterEntity();
            saveEntity.companyId = reqModel.id;
            saveEntity.employeeId = empInfo.id;
            saveEntity.isActive = reqModel.isActive ?? true;
            saveEntity.name = reqModel.name;
            saveEntity.email = reqModel.email;
            saveEntity.slackUserId = reqModel.slackUserId;
            saveEntity.displayName = reqModel.displayName;
            saveEntity.role = reqModel.role;

            saveEntity.phone = reqModel.phone;
            saveEntity.userId = reqModel.userId;
            saveEntity.avatarUrl = reqModel.avatarUrl;
            saveEntity.isAdmin = reqModel.isAdmin;
            saveEntity.timezone = reqModel.timezone;
            saveEntity.timezoneLabel = reqModel.timezoneLabel;
            saveEntity.teamId = reqModel.teamId;
            await transManager.getRepository(SlackUsersMasterEntity).save(saveEntity);

            // Sync with Employee Table
            if (empInfo) {
                empInfo.slackUserId = reqModel.slackUserId;
                empInfo.slackDisplayName = reqModel.displayName;
                empInfo.slackAvatar = reqModel.avatarUrl;
                empInfo.slackIsAdmin = reqModel.isAdmin || false;
                empInfo.slackTimezone = reqModel.timezone;
                empInfo.slackTeamId = reqModel.teamId;
                empInfo.isSlackActive = reqModel.isActive;
                await transManager.getRepository(EmployeesEntity).save(empInfo);
            }

            await transManager.completeTransaction();
            return new GlobalResponse(true, 201, 'Slack User created successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getAllSlackUsers(): Promise<GetAllSlackUsersResponseModel> {
        try {
            const users = await this.slackUserRepo.find();

            const companyIds = [...new Set(users.map(u => Number(u.companyId)).filter(Boolean))];
            const companies = companyIds.length > 0
                ? await this.dataSource.getRepository(CompanyInfoEntity).find({ where: { id: In(companyIds) } })
                : [];
            const companyMap = new Map<number, string>();
            companies.forEach(c => companyMap.set(Number(c.id), c.companyName));

            const mappedUsers = users.map(u => ({
                ...u,
                companyName: companyMap.get(Number(u.companyId)) || null
            }));
            return new GetAllSlackUsersResponseModel(true, 200, 'Slack Users retrieved successfully', mappedUsers as any);
        } catch (error) {
            throw new ErrorResponse(500, 'Failed to fetch Slack Users');
        }
    }

    async updateSlackUser(reqModel: UpdateSlackUserModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existing = await this.slackUserRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Slack User not found');
            }

            await transManager.startTransaction();
            await transManager.getRepository(SlackUsersMasterEntity).update(reqModel.id, {
                name: reqModel.name,
                email: reqModel.email,
                slackUserId: reqModel.slackUserId,
                displayName: reqModel.displayName,
                role: reqModel.role,

                phone: reqModel.phone,
                isActive: reqModel.isActive,
                employeeId: reqModel.employeeId,
                avatarUrl: reqModel.avatarUrl,
                isAdmin: reqModel.isAdmin,
                timezone: reqModel.timezone,
                timezoneLabel: reqModel.timezoneLabel,
                teamId: reqModel.teamId
            });

            const targetEmployeeId = reqModel.employeeId || existing.employeeId;
            if (targetEmployeeId) {
                const empInfo = await transManager.getRepository(EmployeesEntity).findOne({ where: { id: targetEmployeeId } });
                if (empInfo) {
                    empInfo.slackUserId = reqModel.slackUserId;
                    empInfo.slackDisplayName = reqModel.displayName;
                    empInfo.isSlackActive = reqModel.isActive;
                    empInfo.slackAvatar = reqModel.avatarUrl;
                    empInfo.slackIsAdmin = reqModel.isAdmin || false;
                    empInfo.slackTimezone = reqModel.timezone;
                    empInfo.slackTeamId = reqModel.teamId;
                    await transManager.getRepository(EmployeesEntity).save(empInfo);
                }
            }

            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Slack User updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async deleteSlackUser(reqModel: IdRequestModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existing = await this.slackUserRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Slack User not found');
            }

            await transManager.startTransaction();
            await transManager.getRepository(SlackUsersMasterEntity).delete(reqModel.id);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Slack User deleted successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
