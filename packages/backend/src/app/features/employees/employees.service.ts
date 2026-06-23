import { Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { EmployeesRepository } from './repositories/employees.repository';
import { EmployeesEntity } from './entities/employees.entity';
import { CompanyInfoEntity } from '../masters/company-info/entities/company-info.entity';
import { DepartmentsMasterEntity } from '../masters/department/entities/department.entity';
import { GenericTransactionManager } from '../../../database/typeorm-transactions';
import { ErrorResponse, GlobalResponse } from '@bosvault/backend-utils';
import { CreateEmployeeModel, UpdateEmployeeModel, DeleteEmployeeModel, GetEmployeeModel, GetAllEmployeesResponseModel, GetEmployeeResponseModel, EmployeeResponseModel, CreateEmailInfoModel, EmailTypeEnum, GetAllEmployeesRequestModel, EmployeeStatusEnum } from '@bosvault/shared-models';
import { EmailInfoService } from '../email/email-info.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUsersEntity } from '../auth-users/entities/auth-users.entity';
import { EmailInfoEntity } from '../email/entities/email-info.entity';

@Injectable()
export class EmployeesService {
    constructor(
        private dataSource: DataSource,
        private employeesRepo: EmployeesRepository,
        private emailInfoService: EmailInfoService,
        private notificationsService: NotificationsService
    ) { }

    async createEmployee(reqModel: CreateEmployeeModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.companyId) {
                throw new ErrorResponse(0, "Company ID is required");
            }

            if (!reqModel.email) {
                throw new ErrorResponse(0, "Email is required");
            }
            if (!reqModel.departmentId) {
                throw new ErrorResponse(0, "Department is required");
            }

            const existingEmployee = await this.employeesRepo.findOne({ where: { email: reqModel.email } });
            if (existingEmployee) {
                throw new ErrorResponse(0, "Employee with this email already exists");
            }

            const companyExists = await this.dataSource.getRepository(CompanyInfoEntity).findOne({ where: { id: reqModel.companyId } });
            if (!companyExists) {
                throw new ErrorResponse(0, "Invalid Company ID: Company does not exist");
            }

            const deptExists = await this.dataSource.getRepository(DepartmentsMasterEntity).findOne({ where: { id: reqModel.departmentId } });
            if (!deptExists) {
                throw new ErrorResponse(0, "Invalid Department ID: Department does not exist");
            }

            await transManager.startTransaction();
            const newEmployee = new EmployeesEntity();
            newEmployee.userId = reqModel.userId;
            newEmployee.companyId = reqModel.companyId;
            newEmployee.firstName = reqModel.firstName;
            newEmployee.lastName = reqModel.lastName;
            newEmployee.email = reqModel.email;
            newEmployee.phNumber = reqModel.phNumber;
            newEmployee.empStatus = reqModel.empStatus;
            newEmployee.billingAmount = reqModel.billingAmount;
            newEmployee.departmentId = reqModel.departmentId;
            newEmployee.remarks = reqModel.remarks;
            newEmployee.managerId = reqModel.managerId;
            newEmployee.joiningDate = reqModel.joiningDate;
            newEmployee.emailCreatedDate = reqModel.emailCreatedDate;
            newEmployee.lastWorkingDay = reqModel.lastWorkingDay;
            newEmployee.emailDeletionDate = reqModel.emailDeletionDate;
            newEmployee.groupEmails = reqModel.groupEmails;
            const savedEmployee = await transManager.getRepository(EmployeesEntity).save(newEmployee);


            // Automatically create Individual Identity (Email Info)
            const emailReq = new CreateEmailInfoModel(reqModel.companyId, EmailTypeEnum.USER, deptExists.name, reqModel.email, savedEmployee.id);
            await this.emailInfoService.createEmailInfo(emailReq);

            await transManager.completeTransaction();


            return new GlobalResponse(true, 0, "Employee and Identity created successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async updateEmployee(reqModel: UpdateEmployeeModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Employee ID is required");
            }

            const existingEmployee = await this.employeesRepo.findOne({ where: { id: reqModel.id } });
            if (!existingEmployee) {
                throw new ErrorResponse(0, "Employee not found");
            }

            await transManager.startTransaction();
            const updateData: Partial<EmployeesEntity> = {};
            updateData.firstName = reqModel.firstName;
            updateData.lastName = reqModel.lastName;
            updateData.email = reqModel.email;
            updateData.phNumber = reqModel.phNumber;
            updateData.empStatus = reqModel.empStatus;
            updateData.billingAmount = reqModel.billingAmount;
            updateData.departmentId = reqModel.departmentId;
            updateData.remarks = reqModel.remarks;
            updateData.managerId = reqModel.managerId;
            updateData.joiningDate = reqModel.joiningDate;
            updateData.emailCreatedDate = reqModel.emailCreatedDate;
            updateData.lastWorkingDay = reqModel.lastWorkingDay;
            updateData.emailDeletionDate = reqModel.emailDeletionDate;
            updateData.groupEmails = reqModel.groupEmails;
            await transManager.getRepository(EmployeesEntity).update(reqModel.id, updateData);

            if (reqModel.userRole) {
                const authUser = await transManager.getRepository(AuthUsersEntity).findOne({ where: [ { employeeId: String(reqModel.id) }, { email: reqModel.email } ] });
                if (authUser) {
                    await transManager.getRepository(AuthUsersEntity).update(authUser.id, { userRole: reqModel.userRole as any });
                }
            }

            await transManager.completeTransaction();


            return new GlobalResponse(true, 0, "Employee updated successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getEmployee(reqModel: GetEmployeeModel): Promise<GetEmployeeResponseModel> {
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Employee ID is required");
            }

            const employee = await this.employeesRepo.findOne({
                where: { id: reqModel.id }
            });
            if (!employee) {
                throw new ErrorResponse(0, "Employee not found");
            }

            let deptName = `Dept ID: ${employee.departmentId}`;
            const department = await this.dataSource.getRepository(DepartmentsMasterEntity).findOne({ where: { id: employee.departmentId } });
            if (department) {
                deptName = department.name;
            }

            let managerName = '';
            if (employee.managerId) {
                const manager = await this.employeesRepo.findOne({ where: { id: employee.managerId } });
                if (manager) {
                    managerName = `${manager.firstName} ${manager.lastName}`;
                }
            }

            let userRole: string | undefined;
            const authUser = await this.dataSource.getRepository(AuthUsersEntity).findOne({ where: { email: employee.email } });
            if (authUser) {
                userRole = authUser.userRole;
            }

            const employeeResponse = new EmployeeResponseModel(
                employee.id,
                employee.companyId,
                employee.firstName,
                employee.lastName,
                employee.email,
                employee.departmentId,
                employee.empStatus,
                employee.phNumber,
                employee.billingAmount,
                employee.remarks,
                deptName,
                employee.slackUserId,
                employee.slackDisplayName,
                employee.slackAvatar,
                employee.isSlackActive,
                employee.managerId,
                managerName,
                userRole,
                employee.userId,
                employee.joiningDate,
                employee.emailCreatedDate,
                employee.lastWorkingDay,
                employee.emailDeletionDate,
                employee.groupEmails
            );
            return new GetEmployeeResponseModel(true, 0, "Employee retrieved successfully", employeeResponse);
        } catch (error) {
            throw error;
        }
    }

    async getAllEmployees(reqModel: GetAllEmployeesRequestModel): Promise<GetAllEmployeesResponseModel> {
        let employees: EmployeesEntity[];
        const companyId = Number(reqModel.companyId);
        const includeDeactivated = reqModel.includeDeactivated === true;

        try {
            const whereClause: any = {};
            if (companyId) {
                whereClause.companyId = companyId;
            }

            if (!includeDeactivated) {
                whereClause.empStatus = Not(EmployeeStatusEnum.DEACTIVATED);
            }

            employees = await this.employeesRepo.find({
                where: whereClause,
                order: { createdAt: 'DESC' }
            });

            const deptIds = [...new Set(employees.filter(e => e.departmentId && Number(e.departmentId) > 0).map(e => Number(e.departmentId)))];
            const deptMap = new Map<number, string>();

            if (deptIds.length > 0) {
                const departments = await this.dataSource.getRepository(DepartmentsMasterEntity).find({ where: { id: In(deptIds) } });
                departments.forEach(d => {
                    deptMap.set(Number(d.id), d.name);
                });
            }

            const managerIds = [...new Set(employees.filter(e => e.managerId && Number(e.managerId) > 0).map(e => Number(e.managerId)))];
            const managerMap = new Map<number, string>();
            if (managerIds.length > 0) {
                const managers = await this.employeesRepo.find({ where: { id: In(managerIds) } });
                managers.forEach(m => managerMap.set(Number(m.id), `${m.firstName} ${m.lastName}`));
            }

            const emails = [...new Set(employees.filter(e => e.email).map(e => e.email))];
            const userRoleMap = new Map<string, string>();
            if (emails.length > 0) {
                const users = await this.dataSource.getRepository(AuthUsersEntity).find({ where: { email: In(emails) } });
                users.forEach(u => userRoleMap.set(u.email.toLowerCase(), u.userRole));
            }

            const employeeResponses = employees.map(emp => new EmployeeResponseModel(
                emp.id,
                emp.companyId,
                emp.firstName,
                emp.lastName,
                emp.email,
                emp.departmentId,
                emp.empStatus,
                emp.phNumber,
                emp.billingAmount,
                emp.remarks,
                deptMap.get(Number(emp.departmentId)),
                emp.slackUserId,
                emp.slackDisplayName,
                emp.slackAvatar,
                emp.isSlackActive,
                emp.managerId,
                managerMap.get(Number(emp.managerId)) || '',
                userRoleMap.get(emp.email.toLowerCase()),
                emp.userId,
                emp.joiningDate,
                emp.emailCreatedDate,
                emp.lastWorkingDay,
                emp.emailDeletionDate,
                emp.groupEmails
            ));
            return new GetAllEmployeesResponseModel(true, 0, "Employees retrieved successfully", employeeResponses);
        } catch (error) {
            throw error;
        }
    }

    async deleteEmployee(reqModel: DeleteEmployeeModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Employee ID is required");
            }

            const existingEmployee = await this.employeesRepo.findOne({ where: { id: reqModel.id } });
            if (!existingEmployee) {
                throw new ErrorResponse(0, "Employee not found");
            }

            await transManager.startTransaction();
            await transManager.getRepository(EmployeesEntity).softDelete(reqModel.id);
            await transManager.getRepository(EmailInfoEntity).delete({ employeeId: reqModel.id });
            await transManager.completeTransaction();



            return new GlobalResponse(true, 0, "Employee deleted successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
