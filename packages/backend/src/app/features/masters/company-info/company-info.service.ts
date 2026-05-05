import { Injectable } from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { GenericTransactionManager } from '../../../../database/typeorm-transactions';
import { ErrorResponse, GlobalResponse } from '@bosvault/backend-utils';
import { CompanyResponse, CompanyResponseModel, CreateCompanyModel, DeleteCompanyModel, GetCompanyModel, UpdateCompanyModel, CompanyDropdownResponse, CompanyDropdownModel } from '@bosvault/shared-models';
import { CompanyInfoEntity } from './entities/company-info.entity';
import { CompanyInfoRepository } from './repositories/company-info.repository';
import { EmployeesEntity } from '../../employees/entities/employees.entity';

@Injectable()
export class CompanyInfoService {
    constructor(
        private dataSource: DataSource,
        private companyInfoRepo: CompanyInfoRepository
    ) { }

    async createCompany(reqModel: CreateCompanyModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.companyName || !reqModel.location || !reqModel.estDate) {
                throw new ErrorResponse(0, "Company name, Location and Establishment date are required");
            }

            const existingCompany = await this.companyInfoRepo.findOne({ where: { companyName: reqModel.companyName } });
            if (existingCompany) {
                throw new ErrorResponse(0, "Company with this name already exists");
            }

            if (reqModel.email) {
                const emailExists = await this.companyInfoRepo.findOne({ where: { email: reqModel.email } });
                if (emailExists) {
                    throw new ErrorResponse(0, 'Email already in use');
                }
            }

            if (reqModel.phone) {
                const phoneExists = await this.companyInfoRepo.findOne({ where: { phone: reqModel.phone } });
                if (phoneExists) {
                    throw new ErrorResponse(0, 'Phone number already in use');
                }
            }

            if (reqModel.estDate) {
                const year = new Date(reqModel.estDate).getFullYear();
                if (year > 2026) {
                    throw new ErrorResponse(0, 'Establishment year cannot be in the future (max 2026)');
                }
            }

            await transManager.startTransaction();
            const newCompany = new CompanyInfoEntity();
            newCompany.companyName = reqModel.companyName;
            newCompany.location = reqModel.location;
            newCompany.estDate = reqModel.estDate;
            newCompany.email = reqModel.email;
            newCompany.phone = reqModel.phone;
            newCompany.userId = reqModel.userId;
            newCompany.slackBotToken = reqModel.slackBotToken;
            newCompany.slackWorkspaceId = reqModel.slackWorkspaceId;
            await transManager.getRepository(CompanyInfoEntity).save(newCompany);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 0, "Company created successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async updateCompany(reqModel: UpdateCompanyModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);

        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, 'Company ID is required');
            }

            const existingCompany = await this.companyInfoRepo.findOne({ where: { id: reqModel.id } });
            if (!existingCompany) {
                throw new ErrorResponse(0, 'Company not found');
            }

            if (reqModel.companyName !== undefined && reqModel.companyName.trim() === '') {
                throw new ErrorResponse(0, 'Company name cannot be empty');
            }

            if (reqModel.email) {
                const emailExists = await this.companyInfoRepo.findOne({ where: { email: reqModel.email, id: Not(reqModel.id) } });
                if (emailExists) {
                    throw new ErrorResponse(0, 'Email already in use');
                }
            }

            if (reqModel.phone) {
                const phoneExists = await this.companyInfoRepo.findOne({ where: { phone: reqModel.phone, id: Not(reqModel.id) } });
                if (phoneExists) {
                    throw new ErrorResponse(0, 'Phone number already in use');
                }
            }

            if (reqModel.estDate) {
                const year = new Date(reqModel.estDate).getFullYear();
                if (year > 2026) {
                    throw new ErrorResponse(0, 'Establishment year cannot be in the future (max 2026)');
                }
            }

            await transManager.startTransaction();
            const updateData: Partial<CompanyInfoEntity> = {
                companyName: reqModel.companyName,
                location: reqModel.location,
                estDate: reqModel.estDate,
                email: reqModel.email,
                phone: reqModel.phone,
                userId: reqModel.userId,
                slackBotToken: reqModel.slackBotToken,
                slackWorkspaceId: reqModel.slackWorkspaceId
            };
            Object.keys(updateData).forEach(key => (updateData[key as keyof CompanyInfoEntity] === undefined) && delete updateData[key as keyof CompanyInfoEntity]);

            if (Object.keys(updateData).length === 0) {
                throw new ErrorResponse(0, 'No valid fields provided for update');
            }

            await transManager.getRepository(CompanyInfoEntity).update(reqModel.id, updateData);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 0, 'Company updated successfully');
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }

    async getCompany(reqModel: GetCompanyModel): Promise<CompanyResponse> {
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Company ID is required");
            }

            const company = await this.companyInfoRepo.findOne({ where: { id: reqModel.id } });
            if (!company) {
                throw new ErrorResponse(0, "Company not found");
            }

            const companyDoc = new CompanyResponseModel(company.id, company.companyName, company.location, company.estDate as any, company.email, company.phone, company.slackBotToken, company.slackWorkspaceId);
            return new CompanyResponse(true, 0, "Company retrieved successfully", [companyDoc]);
        } catch (error) {
            throw error;
        }
    }

    async getAllCompanies(): Promise<CompanyResponse> {
        try {
            const companies = await this.companyInfoRepo.find();
            const companyDocs = companies.map(company => new CompanyResponseModel(company.id, company.companyName, company.location, company.estDate, company.email, company.phone, company.slackBotToken, company.slackWorkspaceId));
            return new CompanyResponse(true, 0, "Companies retrieved successfully", companyDocs);
        } catch (error) {
            throw error;
        }
    }

    async getAllCompaniesDropdown(): Promise<CompanyDropdownResponse> {
        try {
            const companies = await this.companyInfoRepo.find({ select: ['id', 'companyName'] });
            const dropdownData = companies.map(company => new CompanyDropdownModel(company.id, company.companyName));
            return new CompanyDropdownResponse(true, 0, "Companies retrieved successfully", dropdownData);
        } catch (error) {
            throw error;
        }
    }

    async deleteCompany(reqModel: DeleteCompanyModel): Promise<GlobalResponse> {
        const transManager = new GenericTransactionManager(this.dataSource);
        try {
            if (!reqModel.id) {
                throw new ErrorResponse(0, "Company ID is required");
            }

            const existingCompany = await this.companyInfoRepo.findOne({ where: { id: reqModel.id } });
            if (!existingCompany) {
                throw new ErrorResponse(0, "Company not found");
            }

            // Check if company is being used by employees
            const employeesCount = await this.dataSource.getRepository(EmployeesEntity).count({ where: { companyId: reqModel.id } });
            if (employeesCount > 0) {
                throw new ErrorResponse(0, `Cannot delete company as it is associated with ${employeesCount} employee(s)`);
            }

            await transManager.startTransaction();
            await transManager.getRepository(CompanyInfoEntity).delete(reqModel.id);
            await transManager.completeTransaction();
            return new GlobalResponse(true, 0, "Company deleted successfully");
        } catch (error) {
            await transManager.releaseTransaction();
            throw error;
        }
    }
}
