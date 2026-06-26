import { Injectable } from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { RemoteRepository } from './repositories/remote.repository';
import { GlobalResponse, ErrorResponse } from '@bosvault/backend-utils';
import { CreateRemoteMasterModel, UpdateRemoteMasterModel, GetAllRemoteMasterResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { RemoteMasterEntity } from './entities/remote.entity';
import { GenericTransactionManager } from '../../../../database/typeorm-transactions';

@Injectable()
export class RemoteService {
    constructor(
        private dataSource: DataSource,
        private remoteRepo: RemoteRepository
    ) { }

    async createRemote(reqModel: CreateRemoteMasterModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.remoteToolName) {
                throw new ErrorResponse(0, "Remote Tool Name is required");
            }

            if (!reqModel.userName || !reqModel.password) {
                throw new ErrorResponse(0, "Username and Password are required");
            }

            // Allow same tool name for different users — unique per (toolName + userName + companyId)
            const existing = await this.remoteRepo.findOne({
                where: {
                    remoteTool: reqModel.remoteToolName,
                    username: reqModel.userName,
                    companyId: reqModel.companyId
                }
            });
            if (existing) {
                throw new ErrorResponse(0, "A Remote Tool entry with this Tool Name and User ID already exists");
            }

            await transManager.startTransaction();
            const newRemote = new RemoteMasterEntity();
            newRemote.userId = reqModel.createdBy; // Map createdBy to userId
            newRemote.companyId = reqModel.companyId;
            newRemote.remoteTool = reqModel.remoteToolName;
            newRemote.username = reqModel.userName;
            newRemote.userFullname = reqModel.userFullname;
            newRemote.deviceSerialNumber = reqModel.deviceSerialNumber;
            newRemote.ipAddress = reqModel.ipAddress;
            newRemote.recoveryEmail = reqModel.recoveryEmail;
            newRemote.password = reqModel.password;
            newRemote.notes = reqModel.notes;
            newRemote.isActive = reqModel.isActive ?? true;

            await transManager.getRepository(RemoteMasterEntity).save(newRemote);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 201, 'Remote Tool created successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getRemote(reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            const remote = await this.remoteRepo.findOne({ where: { id: reqModel.id } });
            if (!remote) {
                throw new ErrorResponse(404, 'Remote Tool not found');
            }
            return new GlobalResponse(true, 200, 'Remote Tool retrieved successfully', remote);
        } catch (error) {
            throw error;
        }
    }

    async getAllRemotes(companyId?: number): Promise<GetAllRemoteMasterResponseModel> {
        try {
            const whereClause = companyId ? { companyId } : {};
            const remotes = await this.remoteRepo.find({ where: whereClause });
            const mappedList = remotes.map(remote => ({
                id: remote.id,
                companyId: remote.companyId || 0,
                remoteToolName: remote.remoteTool,
                userName: remote.username,
                userFullname: remote.userFullname,
                deviceSerialNumber: remote.deviceSerialNumber,
                ipAddress: remote.ipAddress,
                recoveryEmail: remote.recoveryEmail,
                password: remote.password,
                notes: remote.notes,
                isActive: remote.isActive,
                createdBy: remote.userId,
                createdAt: remote.createdAt,
                updatedAt: remote.updatedAt
            }));
            return new GetAllRemoteMasterResponseModel(true, 200, 'Remote Tools retrieved successfully', mappedList);
        } catch (error) {
            throw error;
        }
    }

    async updateRemote(reqModel: UpdateRemoteMasterModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            const existing = await this.remoteRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Remote Tool not found');
            }

            if (reqModel.remoteToolName !== undefined && reqModel.remoteToolName.trim() === '') {
                throw new ErrorResponse(0, 'Remote Tool name cannot be empty');
            }

            if (reqModel.remoteToolName) {
                const existingTool = await this.remoteRepo.findOne({
                    where: {
                        remoteTool: reqModel.remoteToolName,
                        username: reqModel.userName,
                        id: Not(reqModel.id)
                    }
                });
                if (existingTool) {
                    throw new ErrorResponse(0, "A Remote Tool entry with this Tool Name and User ID already exists");
                }
            }

            await transManager.startTransaction();
            const updateData: Partial<RemoteMasterEntity> = {
                remoteTool: reqModel.remoteToolName,
                username: reqModel.userName,
                userFullname: reqModel.userFullname,
                deviceSerialNumber: reqModel.deviceSerialNumber,
                ipAddress: reqModel.ipAddress,
                recoveryEmail: reqModel.recoveryEmail,
                password: reqModel.password,
                notes: reqModel.notes,
                isActive: reqModel.isActive
            };

            await transManager.getRepository(RemoteMasterEntity).update(reqModel.id, updateData);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Remote Tool updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async deleteRemote(reqModel: IdRequestModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            await transManager.startTransaction();
            const repo = transManager.getRepository(RemoteMasterEntity);
            const delEntity = await repo.findOne({ where: { id: reqModel.id } });
            if (delEntity) await repo.remove(delEntity);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Remote Tool deleted successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
