import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource } from 'typeorm';
import { TicketsRepository } from './repositories/tickets.repository';
import { EmployeesRepository } from '../employees/repositories/employees.repository';
import { TicketsEntity } from './entities/tickets.entity';
import { GenericTransactionManager } from '../../../database/typeorm-transactions';
import { ErrorResponse, GlobalResponse } from '@bosvault/backend-utils';
import { CreateTicketModel, UpdateTicketModel, DeleteTicketModel, GetTicketModel, GetAllTicketsModel, GetTicketByIdModel, TicketResponseModel, TicketStatusEnum, TicketPriorityEnum, TicketCategoryEnum, UserRoleEnum, SendTicketCreatedEmailModel, GetTicketStatisticsRequestModel, UpdateTicketStatusRequestModel, AssignTicketRequestModel, AddTicketResponseRequestModel, SendTicketStatusUpdateEmailModel } from '@bosvault/shared-models';
import { TicketsGateway } from './tickets.gateway';
import { EmailInfoService } from '../email/email-info.service';
import { AuthUsersEntity } from '../auth-users/entities/auth-users.entity';
import { TicketWorkLogEntity } from './entities/ticket-work-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TicketsService {
    private readonly uploadPath = path.resolve(__dirname, '../../../../../../uploads/tickets');

    constructor(
        private dataSource: DataSource,
        private ticketsRepo: TicketsRepository,
        private employeesRepo: EmployeesRepository,
        @InjectRepository(TicketWorkLogEntity)
        private workLogRepo: Repository<TicketWorkLogEntity>,
        private gateway: TicketsGateway,
        private emailInfoService: EmailInfoService
    ) {
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async uploadAttachment(file: Express.Multer.File, userId: number): Promise<GlobalResponse> {
        try {
            if (!file) {
                throw new ErrorResponse(400, 'No file uploaded');
            }

            const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const fileName = `${Date.now()}-${sanitizedOriginalName}`;
            const filePath = path.join(this.uploadPath, fileName);

            // Save file to disk
            fs.writeFileSync(filePath, file.buffer);

            const fileUrl = `/uploads/tickets/${fileName}`; // Assuming a static file server or similar routing

            return new GlobalResponse(true, 201, 'File uploaded successfully', {
                name: file.originalname,
                url: fileUrl,
                type: file.mimetype,
                size: file.size,
                fileName: fileName
            });
        } catch (error) {
            throw error instanceof ErrorResponse ? error : new ErrorResponse(500, 'Failed to upload attachment');
        }
    }

    getAttachment(filename: string): string {
        const filePath = path.join(this.uploadPath, filename);
        if (!fs.existsSync(filePath)) {
            throw new ErrorResponse(404, 'File not found');
        }
        return filePath;
    }

    async createTicket(reqModel: CreateTicketModel, userId?: number, userEmail?: string, ipAddress?: string): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {

            if (!reqModel.categoryEnum) {
                throw new ErrorResponse(400, 'Category is required');
            }
            if (!reqModel.priorityEnum) {
                throw new ErrorResponse(400, 'Priority is required');
            }
            if (!reqModel.subject) {
                throw new ErrorResponse(400, 'Subject is required');
            }

            const emailToUse = userEmail || reqModel.userEmail;
            if (!emailToUse) {
                throw new ErrorResponse(400, 'User email is required');
            }

            const employee = await this.employeesRepo.findOne({ where: { email: emailToUse } });

            if (!employee) {
                throw new ErrorResponse(404, `No Employee profile found for ${emailToUse}. Tickets must be linked to an employee. Please contact your Admin.`);
            }

            if (!reqModel.ticketCode) {
                reqModel.ticketCode = await this.generateTicketCode();
            } else {
                // If provided, check for duplicates
                const existing = await this.ticketsRepo.findOne({ where: { ticketCode: reqModel.ticketCode } });
                if (existing) {
                    throw new ErrorResponse(400, 'Ticket code already exists');
                }
            }

            await transManager.startTransaction();

            // Calculate SLA Deadline
            let slaHours = 24;
            if (reqModel.priorityEnum === TicketPriorityEnum.HIGH) slaHours = 4;
            else if (reqModel.priorityEnum === TicketPriorityEnum.LOW) slaHours = 72;

            const now = new Date();
            const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

            const entity = this.ticketsRepo.create({
                ...reqModel,
                employeeId: employee.id, // Use the resolved employee ID
                userId: userId,
                companyId: employee.companyId,
                slaDeadline: slaDeadline,
                assignAdminId: reqModel.assignAdminId,
                expectedCompletionDate: reqModel.expectedCompletionDate
            });

            const savedTicket = await transManager.getRepository(TicketsEntity).save(entity);
            await transManager.completeTransaction();

            // Notify admins via WebSocket
            this.gateway.emitTicketCreated(savedTicket);


            // Send Emails
            // 1. To User
            await this.emailInfoService.sendTicketCreatedEmail(new SendTicketCreatedEmailModel(savedTicket, emailToUse, 'User'));

            // 2. To Admins & Managers


            // 2. To Specific Manager (if exists)
            if (employee.managerId) {
                const manager = await this.employeesRepo.findOne({ where: { id: employee.managerId } });
                if (manager && manager.email && manager.email !== emailToUse) {
                    await this.emailInfoService.sendTicketCreatedEmail(new SendTicketCreatedEmailModel(savedTicket, manager.email, 'Manager'));
                }
            }

            // 3. To IT Admins (UserRoleEnum.ADMIN)
            const authRepo = this.dataSource.getRepository(AuthUsersEntity);
            const admins = await authRepo.find({
                where: { companyId: employee.companyId, userRole: UserRoleEnum.ADMIN }
            });

            for (const admin of admins) {
                if (admin.email !== emailToUse) {
                    await this.emailInfoService.sendTicketCreatedEmail(new SendTicketCreatedEmailModel(savedTicket, admin.email, admin.userRole));
                }
            }

            return new GlobalResponse(true, 201, "Ticket created successfully", savedTicket);
        } catch (error) {
            await transManager.releaseTransaction();
            throw error instanceof ErrorResponse ? error : new ErrorResponse(500, 'Failed to create ticket');
        }
    }

    private async generateTicketCode(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

        // Find the latest ticket code for today
        const latestTicket = await this.ticketsRepo
            .createQueryBuilder('ticket')
            .where('ticket.ticketCode LIKE :prefix', { prefix: `TKT-${dateStr}-%` })
            .orderBy('ticket.ticketCode', 'DESC')
            .getOne();

        let sequence = 1;
        if (latestTicket) {
            // Extract sequence number from last ticket code
            const parts = latestTicket.ticketCode.split('-');
            if (parts.length === 3) {
                sequence = parseInt(parts[2]) + 1;
            }
        }

        // Format: TKT-YYYYMMDD-XXXX
        return `TKT-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    }

    async updateTicket(reqModel: UpdateTicketModel, userId?: number, ipAddress?: string): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(400, 'Ticket ID is required');
            }
            const existing = await this.ticketsRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Ticket not found');
            }

            const oldStatus = existing.ticketStatus;

            await transManager.startTransaction();
            await transManager.getRepository(TicketsEntity).update(reqModel.id, reqModel);

            // If time spent is provided, optionally create a work log
            if (reqModel.timeSpentMinutes && reqModel.timeSpentMinutes > 0) {
                const workLog = new TicketWorkLogEntity();
                workLog.ticketId = reqModel.id;
                workLog.timeSpentMinutes = reqModel.timeSpentMinutes;
                workLog.description = `Work logged during ticket update. Total time spent updated to ${reqModel.timeSpentMinutes}m.`;
                workLog.startTime = new Date();
                // If we had a technicianId, we'd use it here. Defaulting for now or using userId.
                workLog.technicianId = userId;
                await transManager.getRepository(TicketWorkLogEntity).save(workLog);
            }

            await transManager.completeTransaction();

            // Notify via WebSocket
            const updated = await this.ticketsRepo.findOne({ where: { id: reqModel.id } });
            this.gateway.emitTicketUpdated(updated);

            // Send Email Notification if status logic is handled here (usually updateStatus is preferred, but updateTicket might change it too)
            // Determine new status from reqModel or updated entity
            if (updated.ticketStatus !== oldStatus) {
                await this.sendStatusChangeEmails(updated, oldStatus, updated.ticketStatus);
            }

            return new GlobalResponse(true, 200, "Ticket updated successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error instanceof ErrorResponse ? error : new ErrorResponse(500, 'Failed to update ticket');
        }
    }

    async getTicket(reqModel: GetTicketModel): Promise<GetTicketByIdModel> {
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(400, 'Ticket ID is required');
            }
            const ticket: any = await this.ticketsRepo
                .createQueryBuilder('ticket')
                .leftJoinAndMapOne('ticket.employee', 'employees', 'emp', 'emp.id = ticket.employeeId')
                .where('ticket.id = :id', { id: reqModel.id })
                .getOne();

            if (!ticket) {
                throw new ErrorResponse(404, 'Ticket not found');
            }

            const response = new TicketResponseModel(
                ticket.id,
                ticket.ticketCode,
                ticket.employeeId,
                ticket.categoryEnum,
                ticket.priorityEnum,
                ticket.subject,
                ticket.ticketStatus,
                ticket.assignAdminId,
                ticket.expectedCompletionDate,
                ticket.resolvedAt,
                ticket.employee ? `${ticket.employee.firstName} ${ticket.employee.lastName}` : `User ID: ${ticket.employeeId}`,
                ticket.employee ? ticket.employee.email : undefined,
                ticket.createdAt,
                ticket.updatedAt,
                ticket.slaDeadline,
                ticket.timeSpentMinutes,
                ticket.description,
                ticket.subCategory,
                ticket.severityEnum,
                ticket.department,
                ticket.contactNumber,
                ticket.location,
                ticket.contactEmail,
                ticket.assignedGroup,
                ticket.slaType,
                ticket.responseDueTime,
                ticket.escalationLevel,
                ticket.adminComments,
                ticket.userComments,
                ticket.internalNotes,
                ticket.rootCause,
                ticket.resolutionSummary,
                ticket.resolvedBy,
                ticket.closureRemarks,
                ticket.userRating,
                ticket.userFeedback
            );
            response.originalEstimate = ticket.originalEstimate;
            response.timeSpent = ticket.timeSpent;
            return new GetTicketByIdModel(true, 200, 'Ticket retrieved successfully', response);
        } catch (error) {
            throw error instanceof ErrorResponse ? error : new ErrorResponse(500, 'Failed to fetch ticket');
        }
    }

    async getAllTickets(companyId?: number): Promise<GetAllTicketsModel> {
        try {
            const query = this.ticketsRepo
                .createQueryBuilder('ticket')
                .leftJoinAndMapOne('ticket.employee', 'employees', 'emp', 'emp.id = ticket.employeeId')
                .orderBy('ticket.createdAt', 'DESC');

            // if (companyId) {
            //     query.where('ticket.companyId = :companyId', { companyId });
            // }

            const tickets: any[] = await query.getMany();

            const responses = tickets.map(t => new TicketResponseModel(
                t.id,
                t.ticketCode,
                t.employeeId,
                t.categoryEnum,
                t.priorityEnum,
                t.subject,
                t.ticketStatus,
                t.assignAdminId,
                t.expectedCompletionDate,
                t.resolvedAt,
                t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : `User ID: ${t.employeeId}`,
                t.employee ? t.employee.email : `User ID: ${t.employeeId}`,
                t.createdAt,
                t.updatedAt,
                t.slaDeadline,
                t.timeSpentMinutes,
                t.description,
                t.subCategory,
                t.severityEnum,
                t.department,
                t.contactNumber,
                t.location,
                t.contactEmail,
                t.assignedGroup,
                t.slaType,
                t.responseDueTime,
                t.escalationLevel,
                t.adminComments,
                t.userComments,
                t.internalNotes,
                t.rootCause,
                t.resolutionSummary,
                t.resolvedBy,
                t.closureRemarks,
                t.userRating,
                t.userFeedback
            ));
            responses.forEach((r, idx) => {
                r.originalEstimate = tickets[idx].originalEstimate;
                r.timeSpent = tickets[idx].timeSpent;
            });
            return new GetAllTicketsModel(true, 200, 'Tickets retrieved successfully', responses);
        } catch (error) {
            throw new ErrorResponse(500, 'Failed to fetch tickets');
        }
    }

    async deleteTicket(reqModel: DeleteTicketModel, userId?: number, ipAddress?: string): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(400, 'Ticket ID is required');
            }
            const existing = await this.ticketsRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Ticket not found');
            }

            await transManager.startTransaction();
            await transManager.getRepository(TicketsEntity).softDelete(reqModel.id);
            await transManager.completeTransaction();


            return new GlobalResponse(true, 200, "Ticket deleted successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error instanceof ErrorResponse ? error : new ErrorResponse(500, 'Failed to delete ticket');
        }
    }

    async getTicketsByUser(userEmail: string): Promise<GetAllTicketsModel> {
        try {
            if (!userEmail) {
                throw new ErrorResponse(400, 'User email is required');
            }

            const employee = await this.employeesRepo.findOne({ where: { email: userEmail } });
            if (!employee) {
                return new GetAllTicketsModel(true, 200, 'No employee record found, zero tickets retrieved', []);
            }

            const tickets: any[] = await this.ticketsRepo
                .createQueryBuilder('ticket')
                .leftJoinAndMapOne('ticket.employee', 'employees', 'emp', 'emp.id = ticket.employeeId')
                .where('ticket.employeeId = :employeeId', { employeeId: employee.id })
                .orderBy('ticket.createdAt', 'DESC')
                .getMany();

            const responses = tickets.map(t => new TicketResponseModel(
                t.id,
                t.ticketCode,
                t.employeeId,
                t.categoryEnum,
                t.priorityEnum,
                t.subject,
                t.ticketStatus,
                t.assignAdminId,
                t.expectedCompletionDate,
                t.resolvedAt,
                t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : `User ID: ${t.employeeId}`,
                t.employee ? t.employee.email : `User ID: ${t.employeeId}`,
                t.createdAt,
                t.updatedAt,
                t.slaDeadline,
                t.timeSpentMinutes,
                t.description,
                t.subCategory,
                t.severityEnum,
                t.department,
                t.contactNumber,
                t.location,
                t.contactEmail,
                t.assignedGroup,
                t.slaType,
                t.responseDueTime,
                t.escalationLevel,
                t.adminComments,
                t.userComments,
                t.internalNotes,
                t.rootCause,
                t.resolutionSummary,
                t.resolvedBy,
                t.closureRemarks,
                t.userRating,
                t.userFeedback
            ));
            responses.forEach((r, idx) => {
                r.originalEstimate = tickets[idx].originalEstimate;
                r.timeSpent = tickets[idx].timeSpent;
            });
            return new GetAllTicketsModel(true, 200, 'User tickets retrieved successfully', responses);
        } catch (error) {
            throw error instanceof ErrorResponse ? error : new ErrorResponse(500, 'Failed to fetch user tickets');
        }
    }

    async getStatisticsByCompany(companyId: number): Promise<any> {
        const total = await this.ticketsRepo.count({ where: { companyId } });
        const open = await this.ticketsRepo.count({ where: { companyId, ticketStatus: TicketStatusEnum.OPEN } });
        const inProgress = await this.ticketsRepo.count({ where: { companyId, ticketStatus: TicketStatusEnum.IN_PROGRESS } });
        const resolved = await this.ticketsRepo.count({ where: { companyId, ticketStatus: TicketStatusEnum.RESOLVED } });

        return { total, open, inProgress, resolved };
    }

    async getStatistics(reqModel: GetTicketStatisticsRequestModel): Promise<any> {
        const companyId = reqModel.companyId;
        const tickets = await this.ticketsRepo.find({
            where: companyId > 0 ? { companyId } : {}
        });

        // SLA calculation: only on tickets that have an SLA deadline
        const resolvedOrClosed = tickets.filter(t => t.ticketStatus === TicketStatusEnum.RESOLVED || t.ticketStatus === TicketStatusEnum.CLOSED);
        const resolvedWithSLA = resolvedOrClosed.filter(t => t.slaDeadline);
        
        const slaMetCount = resolvedWithSLA.filter(t => {
            const resolvedTime = t.resolvedAt ? new Date(t.resolvedAt).getTime() : new Date().getTime();
            return resolvedTime <= new Date(t.slaDeadline).getTime();
        }).length;
        
        const slaBreachedCount = resolvedWithSLA.length - slaMetCount;
        
        const openOverdueCount = tickets.filter(t => 
            t.ticketStatus !== TicketStatusEnum.RESOLVED && 
            t.ticketStatus !== TicketStatusEnum.CLOSED && 
            t.slaDeadline && 
            new Date().getTime() > new Date(t.slaDeadline).getTime()
        ).length;

        // CSAT calculation
        const ratedTickets = tickets.filter(t => t.userRating && t.userRating > 0);
        const avgCSAT = ratedTickets.length > 0
            ? Number((ratedTickets.reduce((acc, t) => acc + t.userRating, 0) / ratedTickets.length).toFixed(1))
            : 0;

        const ratingsDistribution = {
            5: ratedTickets.filter(t => t.userRating === 5).length,
            4: ratedTickets.filter(t => t.userRating === 4).length,
            3: ratedTickets.filter(t => t.userRating === 3).length,
            2: ratedTickets.filter(t => t.userRating === 2).length,
            1: ratedTickets.filter(t => t.userRating === 1).length,
        };

        // Average Resolution Time (in hours)
        const resolvedTicketsWithTimes = resolvedOrClosed.filter(t => t.createdAt && t.resolvedAt);
        const avgResolutionTimeHours = resolvedTicketsWithTimes.length > 0
            ? Number((resolvedTicketsWithTimes.reduce((acc, t) => {
                const diff = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
                return acc + (diff / (1000 * 60 * 60));
              }, 0) / resolvedTicketsWithTimes.length).toFixed(1))
            : 0;

        // Resolution Rate
        const resolutionRate = tickets.length > 0
            ? Math.round((resolvedOrClosed.length / tickets.length) * 100)
            : 0;

        // SLA Compliance Rate
        const slaComplianceRate = resolvedWithSLA.length > 0
            ? Math.round((slaMetCount / resolvedWithSLA.length) * 100)
            : 100; // If no tickets have SLA, default to 100%

        // Monthly trends (last 6 months)
        const monthlyTrendsMap: Record<string, { created: number, resolved: number }> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Pre-populate last 6 months in chronological order
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
            monthlyTrendsMap[label] = { created: 0, resolved: 0 };
        }

        tickets.forEach(t => {
            if (t.createdAt) {
                const createdDate = new Date(t.createdAt);
                const createdLabel = `${monthNames[createdDate.getMonth()]} ${createdDate.getFullYear().toString().slice(-2)}`;
                if (monthlyTrendsMap[createdLabel]) {
                    monthlyTrendsMap[createdLabel].created += 1;
                }
            }
            if (t.resolvedAt) {
                const resolvedDate = new Date(t.resolvedAt);
                const resolvedLabel = `${monthNames[resolvedDate.getMonth()]} ${resolvedDate.getFullYear().toString().slice(-2)}`;
                if (monthlyTrendsMap[resolvedLabel]) {
                    monthlyTrendsMap[resolvedLabel].resolved += 1;
                }
            }
        });

        const monthlyTrends = Object.entries(monthlyTrendsMap).map(([month, data]) => ({
            month,
            created: data.created,
            resolved: data.resolved
        }));

        // Admin Performance
        const adminRepo = this.dataSource.getRepository(AuthUsersEntity);
        const allAdmins = await adminRepo.find({
            where: companyId > 0 ? { companyId } : {}
        });
        const adminMap = new Map<number, string>();
        allAdmins.forEach(admin => {
            adminMap.set(admin.id, admin.fullName);
        });

        const adminPerformanceMap: Record<number, { name: string, assigned: number, resolved: number, avgRating: number, ratingCount: number, totalRatingSum: number }> = {};
        
        tickets.forEach(t => {
            if (t.assignAdminId) {
                const adminId = Number(t.assignAdminId);
                const adminName = adminMap.get(adminId) || `Admin #${adminId}`;
                if (!adminPerformanceMap[adminId]) {
                    adminPerformanceMap[adminId] = {
                        name: adminName,
                        assigned: 0,
                        resolved: 0,
                        avgRating: 0,
                        ratingCount: 0,
                        totalRatingSum: 0
                    };
                }
                
                adminPerformanceMap[adminId].assigned += 1;
                if (t.ticketStatus === TicketStatusEnum.RESOLVED || t.ticketStatus === TicketStatusEnum.CLOSED) {
                    adminPerformanceMap[adminId].resolved += 1;
                }
                if (t.userRating && t.userRating > 0) {
                    adminPerformanceMap[adminId].ratingCount += 1;
                    adminPerformanceMap[adminId].totalRatingSum += t.userRating;
                }
            }
        });

        const adminPerformance = Object.entries(adminPerformanceMap).map(([id, data]) => {
            const avgRating = data.ratingCount > 0
                ? Number((data.totalRatingSum / data.ratingCount).toFixed(1))
                : 0;
            return {
                adminId: Number(id),
                name: data.name,
                assigned: data.assigned,
                resolved: data.resolved,
                avgRating: avgRating
            };
        }).sort((a, b) => b.resolved - a.resolved);

        return {
            status: true,
            code: 200,
            message: "Statistics retrieved successfully",
            total: tickets.length,
            open: tickets.filter(t => t.ticketStatus === TicketStatusEnum.OPEN).length,
            inProgress: tickets.filter(t => t.ticketStatus === TicketStatusEnum.IN_PROGRESS).length,
            resolved: tickets.filter(t => t.ticketStatus === TicketStatusEnum.RESOLVED).length,
            closed: tickets.filter(t => t.ticketStatus === TicketStatusEnum.CLOSED).length,
            byPriority: {
                high: tickets.filter(t => t.priorityEnum === TicketPriorityEnum.HIGH).length,
                medium: tickets.filter(t => t.priorityEnum === TicketPriorityEnum.MEDIUM).length,
                low: tickets.filter(t => t.priorityEnum === TicketPriorityEnum.LOW).length,
            },
            byCategory: {
                hardware: tickets.filter(t => t.categoryEnum === TicketCategoryEnum.HARDWARE).length,
                software: tickets.filter(t => t.categoryEnum === TicketCategoryEnum.SOFTWARE).length,
                network: tickets.filter(t => t.categoryEnum === TicketCategoryEnum.NETWORK).length,
                email: tickets.filter(t => t.categoryEnum === TicketCategoryEnum.EMAIL).length,
                access: tickets.filter(t => t.categoryEnum === TicketCategoryEnum.ACCESS).length,
                other: tickets.filter(t => t.categoryEnum === TicketCategoryEnum.OTHER).length,
            },
            slaStats: {
                complianceRate: slaComplianceRate,
                met: slaMetCount,
                breached: slaBreachedCount,
                openOverdue: openOverdueCount
            },
            csatStats: {
                average: avgCSAT,
                distribution: ratingsDistribution,
                totalRated: ratedTickets.length
            },
            resolutionStats: {
                averageTimeHours: avgResolutionTimeHours,
                resolutionRate: resolutionRate
            },
            monthlyTrends,
            adminPerformance
        };
    }

    async assignTicket(reqModel: AssignTicketRequestModel): Promise<GlobalResponse> {
        const ticket = await this.ticketsRepo.findOne({ where: { id: reqModel.id } });
        if (!ticket) throw new ErrorResponse(404, 'Ticket not found');

        const oldStatus = ticket.ticketStatus;
        ticket.assignAdminId = reqModel.assignAdminId;
        ticket.ticketStatus = TicketStatusEnum.IN_PROGRESS;
        const saved = await this.ticketsRepo.save(ticket);

        // Notify via WebSocket
        this.gateway.emitTicketUpdated(saved);

        // Send Email Notification
        if (oldStatus !== TicketStatusEnum.IN_PROGRESS) {
            await this.sendStatusChangeEmails(saved, oldStatus, TicketStatusEnum.IN_PROGRESS);
        }

        return new GlobalResponse(true, 200, 'Ticket assigned successfully');
    }

    async addResponse(reqModel: AddTicketResponseRequestModel): Promise<GlobalResponse> {
        const ticket = await this.ticketsRepo.findOne({ where: { id: reqModel.id } });
        if (!ticket) throw new ErrorResponse(404, 'Ticket not found');

        ticket.response = reqModel.response;
        const saved = await this.ticketsRepo.save(ticket);

        // Notify via WebSocket
        this.gateway.emitTicketUpdated(saved);

        return new GlobalResponse(true, 200, 'Response added successfully');
    }

    async updateStatus(reqModel: UpdateTicketStatusRequestModel): Promise<GlobalResponse> {
        const ticket = await this.ticketsRepo.findOne({ where: { id: reqModel.id } });
        if (!ticket) throw new ErrorResponse(404, 'Ticket not found');

        const oldStatus = ticket.ticketStatus;
        ticket.ticketStatus = reqModel.status;
        if (reqModel.status === TicketStatusEnum.RESOLVED || reqModel.status === TicketStatusEnum.CLOSED) {
            ticket.resolvedAt = new Date();
        }
        const saved = await this.ticketsRepo.save(ticket);

        // Notify via WebSocket
        this.gateway.emitTicketUpdated(saved);


        // Send Email Notification
        if (oldStatus !== reqModel.status) {
            await this.sendStatusChangeEmails(saved, oldStatus, reqModel.status);
        }

        return new GlobalResponse(true, 200, 'Status updated successfully');
    }

    private async sendStatusChangeEmails(ticket: TicketsEntity, oldStatus: TicketStatusEnum, newStatus: TicketStatusEnum) {
        try {
            // Ensure we have employee details
            let employee = (ticket as any).employee;
            if (!employee) {
                employee = await this.employeesRepo.findOne({ where: { id: ticket.employeeId } });
            }

            if (!employee) {
                console.warn(`Ticket ${ticket.id} has no associated employee, skipping status emails.`);
                return;
            }

            const recipients: { email: string; role: string }[] = [];

            // 1. Ticket Creator (User)
            if (employee.email) {
                recipients.push({ email: employee.email, role: 'User' });
            }

            // 2. Manager
            if (employee.managerId) {
                const manager = await this.employeesRepo.findOne({ where: { id: employee.managerId } });
                if (manager && manager.email) {
                    recipients.push({ email: manager.email, role: 'Manager' });
                }
            }

            // 3. IT Admins
            const authRepo = this.dataSource.getRepository(AuthUsersEntity);
            const admins = await authRepo.find({
                where: { companyId: employee.companyId, userRole: UserRoleEnum.ADMIN }
            });
            for (const admin of admins) {
                if (admin.email) {
                    recipients.push({ email: admin.email, role: 'Admin' });
                }
            }

            // Deduplicate by email
            const uniqueRecipients = new Map<string, string>();
            recipients.forEach(r => uniqueRecipients.set(r.email, r.role));

            for (const [email, role] of uniqueRecipients.entries()) {
                await this.emailInfoService.sendTicketStatusUpdateEmail(
                    new SendTicketStatusUpdateEmailModel(ticket, email, role, oldStatus, newStatus)
                );
            }

        } catch (error) {
            console.error('Failed to send status change emails', error);
        }
    }
}
