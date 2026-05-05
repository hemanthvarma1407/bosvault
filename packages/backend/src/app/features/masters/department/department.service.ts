import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DepartmentRepository } from './repositories/department.repository';
import { GlobalResponse, ErrorResponse } from '@bosvault/backend-utils';
import { CreateDepartmentModel, UpdateDepartmentModel, GetAllDepartmentsResponseModel, CreateDepartmentResponseModel, DepartmentDropdownModel, DepartmentDropdownResponse, IdRequestModel } from '@bosvault/shared-models';
import { DepartmentsMasterEntity } from './entities/department.entity';
import { GenericTransactionManager } from '../../../../database/typeorm-transactions';
import { EmployeesEntity } from '../../employees/entities/employees.entity';

@Injectable()
export class DepartmentService {
    constructor(
        private dataSource: DataSource,
        private deptRepo: DepartmentRepository
    ) { }

    async createDepartment(reqModel: CreateDepartmentModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.name) {
                throw new ErrorResponse(0, "Department name is required");
            }

            const existingDepartment = await this.deptRepo.findOne({ where: { name: reqModel.name } });
            if (existingDepartment) {
                throw new ErrorResponse(0, "Department with this name already exists");
            }

            await transManager.startTransaction();
            const repo = transManager.getRepository(DepartmentsMasterEntity);
            const { id, companyId, ...createData } = reqModel;
            const newItem = repo.create(createData);
            await repo.save(newItem);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 201, 'Department created successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async updateDepartment(reqModel: UpdateDepartmentModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, 'Department ID is required');
            }

            const existing = await this.deptRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Department not found');
            }

            if (reqModel.name !== undefined && reqModel.name.trim() === '') {
                throw new ErrorResponse(0, 'Department name cannot be empty');
            }

            await transManager.startTransaction();
            await transManager.getRepository(DepartmentsMasterEntity).update(reqModel.id, { name: reqModel.name, description: reqModel.description, isActive: reqModel.isActive });
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Department updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getDepartment(reqModel: IdRequestModel): Promise<CreateDepartmentResponseModel> {
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Department ID is required");
            }

            const department = await this.deptRepo.findOne({ where: { id: reqModel.id } });
            if (!department) {
                throw new ErrorResponse(0, "Department not found");
            }

            return new CreateDepartmentResponseModel(true, 200, "Department retrieved successfully", department);
        } catch (error) {
            throw error;
        }
    }

    async getAllDepartments(): Promise<GetAllDepartmentsResponseModel> {
        try {
            const departments = await this.deptRepo.find();
            return new GetAllDepartmentsResponseModel(true, 200, 'Departments retrieved successfully', departments);
        } catch (error) {
            throw error;;
        }
    }

    async getAllDepartmentsDropdown(): Promise<DepartmentDropdownResponse> {
        try {
            const departments = await this.deptRepo.find({ select: ['id', 'name'] });
            const dropdownData = departments.map(dept => new DepartmentDropdownModel(dept.id, dept.name));
            return new DepartmentDropdownResponse(true, 200, "Departments retrieved successfully", dropdownData);
        } catch (error) {
            throw error;
        }
    }

    async deleteDepartment(reqModel: IdRequestModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Department ID is required");
            }

            const existing = await this.deptRepo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(0, 'Department not found');
            }

            // Check if department is being used by employees
            const employeesCount = await this.dataSource.getRepository(EmployeesEntity).count({ where: { departmentId: reqModel.id } });
            if (employeesCount > 0) {
                throw new ErrorResponse(0, `Cannot delete department as it is associated with ${employeesCount} employee(s)`);
            }

            await transManager.startTransaction();
            await transManager.getRepository(DepartmentsMasterEntity).delete(reqModel.id);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 200, 'Department deleted successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
