import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { EmployeesEntity } from './entities/employees.entity';
import { EmployeesRepository } from './repositories/employees.repository';
import { DepartmentRepository } from '../masters/department/repositories/department.repository';
import { CompanyInfoEntity } from '../masters/company-info/entities/company-info.entity';
import { EmployeeStatusEnum, BulkImportResponseModel, BulkImportRequestModel, EmailTypeEnum } from '@bosvault/shared-models';
import { EmailInfoEntity } from '../email/entities/email-info.entity';

import { AuthUsersEntity } from '../auth-users/entities/auth-users.entity';
import { UserRoleEnum } from '@bosvault/shared-models';

@Injectable()
export class EmployeesBulkService {
    constructor(
        private dataSource: DataSource,
        private employeesRepo: EmployeesRepository,
        private departmentRepo: DepartmentRepository
    ) { }

    async processBulkImport(reqModel: BulkImportRequestModel): Promise<BulkImportResponseModel> {
        try {
            const { fileBuffer, companyId, userId } = reqModel;

            // ── Departments ───────────────────────────────────────────────
            const departments = await this.departmentRepo.find();
            const deptIdSet = new Set<number>(departments.map(d => d.id));
            const deptNameMap = new Map<string, number>();
            departments.forEach(d => deptNameMap.set(d.name.toLowerCase().trim(), d.id));

            // ── Company validation ─────────────────────────────────────────
            const companyRepo = this.dataSource.getRepository(CompanyInfoEntity);
            let expectedCompanyName: string | undefined;
            let globalCompany: CompanyInfoEntity | null = null;
            if (companyId) {
                globalCompany = await companyRepo.findOne({ where: { id: companyId } });
                if (!globalCompany) {
                    return new BulkImportResponseModel(false, 400, 'Invalid Company ID', 0, 0, []);
                }
                expectedCompanyName = globalCompany.companyName.toLowerCase().trim();
            }

            const allCompanies = await companyRepo.find();
            const companyNameMap = new Map<string, number>();
            allCompanies.forEach(c => companyNameMap.set(c.companyName.toLowerCase().trim(), c.id));

            // ── Existing employees (for email dedup & manager resolution) ──
            const existingEmployees = companyId ? await this.employeesRepo.find({ where: { companyId } }) : await this.employeesRepo.find();
            const existingEmailSet = new Set(existingEmployees.map(e => e.email.toLowerCase()));
            const emailToIdMap = new Map<string, number>();
            const nameToIdMap = new Map<string, number>(); // "firstname lastname" → id
            const idSet = new Set<number>(existingEmployees.map(e => e.id));

            existingEmployees.forEach(e => {
                emailToIdMap.set(e.email.toLowerCase(), e.id);
                const fullName = `${e.firstName} ${e.lastName}`.toLowerCase().trim();
                nameToIdMap.set(fullName, e.id);
            });

            // ── Parse workbook ─────────────────────────────────────────────
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!rows || rows.length < 2) {
                return new BulkImportResponseModel(false, 400, 'File is empty or missing headers', 0, 0, []);
            }

            const errors: { row: number; error: string }[] = [];
            let successCount = 0;

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                try {
                    // Col 0  : First Name
                    // Col 1  : Last Name
                    // Col 2  : Email
                    // Col 3  : Phone
                    // Col 4  : Department (ID or Name)
                    // Col 5  : Status (active/inactive)
                    // Col 6  : Billing Amount
                    // Col 7  : Remarks
                    // Col 8  : Reporting Manager (ID, Email, or Full Name)
                    // Col 9  : Company Name (optional)
                    // Col 10 : Role (optional)
                    // Col 11 : Joining Date (optional, YYYY-MM-DD)
                    // Col 12 : Email Created Date (optional, YYYY-MM-DD)
                    // Col 13 : Last Working Day (optional, YYYY-MM-DD)
                    // Col 14 : Email Deletion Date (optional, YYYY-MM-DD)
                    // Col 15 : Group Emails (optional, comma-separated)
                    const firstName = row[0]?.toString().trim();
                    const lastName = row[1]?.toString().trim();
                    const email = row[2]?.toString().trim();
                    const phone = row[3]?.toString().trim();
                    const depInput = row[4];
                    const statusStr = row[5]?.toString().trim().toLowerCase();
                    const billingAmount = Number(row[6]);
                    const remarks = row[7]?.toString().trim();
                    const managerInput = row[8]?.toString().trim();
                    const rowCompanyName = row[9]?.toString().trim(); // optional
                    const roleInput = row[10]?.toString().trim().toUpperCase(); // optional Role
                    const joiningDateStr = row[11]?.toString().trim(); // optional
                    const emailCreatedDateStr = row[12]?.toString().trim(); // optional
                    const lastWorkingDayStr = row[13]?.toString().trim(); // optional
                    const emailDeletionDateStr = row[14]?.toString().trim(); // optional
                    const groupEmailsStr = row[15]?.toString().trim(); // optional, comma-separated

                    // ── Required fields ───────────────────────────────────
                    if (!firstName) throw new Error('First Name is required');
                    if (!lastName) throw new Error('Last Name is required');
                    if (!email) throw new Error('Email is required');

                    // ── Company name validation (optional column) ─────────
                    let rowCompanyId = companyId;
                    if (expectedCompanyName) {
                        if (rowCompanyName && rowCompanyName.toLowerCase() !== expectedCompanyName) {
                            throw new Error(
                                `Company name '${rowCompanyName}' does not match the selected company '${globalCompany?.companyName}'.`
                            );
                        }
                    } else if (rowCompanyName) {
                        const matchedId = companyNameMap.get(rowCompanyName.toLowerCase());
                        if (matchedId) {
                            rowCompanyId = matchedId;
                        } else {
                            throw new Error(`Company '${rowCompanyName}' not found.`);
                        }
                    }

                    if (!rowCompanyId) {
                        throw new Error('Company ID is required. Please provide a valid Company Name in the sheet or select a company.');
                    }

                    // ── Department resolution ─────────────────────────────
                    let resolvedDepartmentId: number | undefined;
                    if (depInput) {
                        if (!isNaN(Number(depInput)) && deptIdSet.has(Number(depInput))) {
                            resolvedDepartmentId = Number(depInput);
                        }
                        if (!resolvedDepartmentId) {
                            resolvedDepartmentId = deptNameMap.get(depInput.toString().toLowerCase().trim());
                        }
                        if (!resolvedDepartmentId) {
                            throw new Error(`Department '${depInput}' not found. Use a valid Department Name or ID.`);
                        }
                    } else {
                        throw new Error('Department is required. Provide a valid Department Name or ID.');
                    }

                    // ── Email duplicate check ──────────────────────────────
                    if (existingEmailSet.has(email.toLowerCase())) {
                        throw new Error(`Email '${email}' already exists`);
                    }

                    // ── Manager resolution: ID → Email → Full Name ─────────
                    let resolvedManagerId: number | undefined;
                    if (managerInput) {
                        // 1. Try numeric ID
                        if (!isNaN(Number(managerInput))) {
                            const numId = Number(managerInput);
                            if (idSet.has(numId)) resolvedManagerId = numId;
                        }
                        // 2. Try email
                        if (!resolvedManagerId) {
                            resolvedManagerId = emailToIdMap.get(managerInput.toLowerCase());
                        }
                        // 3. Try full name "First Last"
                        if (!resolvedManagerId) {
                            resolvedManagerId = nameToIdMap.get(managerInput.toLowerCase());
                        }
                        // 4. Not found → error
                        if (!resolvedManagerId) {
                            throw new Error(
                                `Manager '${managerInput}' not found. Provide a valid Employee ID, Email, or Full Name (First Last).`
                            );
                        }
                    }

                    // ── Status ────────────────────────────────────────────
                    const status = statusStr === 'inactive' ? EmployeeStatusEnum.INACTIVE : EmployeeStatusEnum.ACTIVE;

                    // ── Parse optional date fields ────────────────────────
                    const parseDate = (val: string | undefined): Date | undefined => {
                        if (!val) return undefined;
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? undefined : d;
                    };
                    const joiningDate = parseDate(joiningDateStr);
                    const emailCreatedDate = parseDate(emailCreatedDateStr);
                    const lastWorkingDay = parseDate(lastWorkingDayStr);
                    const emailDeletionDate = parseDate(emailDeletionDateStr);
                    const groupEmails = groupEmailsStr
                        ? groupEmailsStr.split(',').map(e => e.trim()).filter(Boolean)
                        : undefined;

                    // ── Save ──────────────────────────────────────────────
                    const newEmployee = new EmployeesEntity();
                    newEmployee.companyId = rowCompanyId;
                    newEmployee.userId = userId;
                    newEmployee.firstName = firstName;
                    newEmployee.lastName = lastName;
                    newEmployee.email = email;
                    newEmployee.phNumber = phone;
                    newEmployee.departmentId = resolvedDepartmentId!;
                    newEmployee.empStatus = status;
                    newEmployee.billingAmount = !isNaN(billingAmount) ? billingAmount : 0;
                    newEmployee.remarks = remarks;
                    newEmployee.managerId = resolvedManagerId;
                    newEmployee.joiningDate = joiningDate;
                    newEmployee.emailCreatedDate = emailCreatedDate;
                    newEmployee.lastWorkingDay = lastWorkingDay;
                    newEmployee.emailDeletionDate = emailDeletionDate;
                    newEmployee.groupEmails = groupEmails;
                    newEmployee.createdAt = new Date();

                    await this.employeesRepo.save(newEmployee);

                    // ── Create Email Info record (mirrors single-employee creation) ──
                    const emailInfoRepo = this.dataSource.getRepository(EmailInfoEntity);
                    const existingEmailInfo = await emailInfoRepo.findOne({ where: { email: email.toLowerCase() } });
                    if (!existingEmailInfo) {
                        const deptRecord = departments.find(d => d.id === resolvedDepartmentId);
                        const newEmailInfo = new EmailInfoEntity();
                        newEmailInfo.companyId = rowCompanyId;
                        newEmailInfo.emailType = EmailTypeEnum.USER;
                        newEmailInfo.department = deptRecord?.name ?? '';
                        newEmailInfo.email = email;
                        newEmailInfo.employeeId = newEmployee.id;
                        if (emailCreatedDate) newEmailInfo.createdDate = emailCreatedDate;
                        await emailInfoRepo.save(newEmailInfo);
                    }

                    // Update in-memory maps so later rows can reference this new employee as manager
                    existingEmailSet.add(email.toLowerCase());
                    emailToIdMap.set(email.toLowerCase(), newEmployee.id);
                    nameToIdMap.set(`${firstName} ${lastName}`.toLowerCase(), newEmployee.id);
                    idSet.add(newEmployee.id);

                    // ── Update Role if provided ───────────────────────────
                    if (roleInput) {
                        const validRoles = Object.values(UserRoleEnum) as string[];
                        if (validRoles.includes(roleInput)) {
                            // Find user by email or employeeId
                            let authUser = await this.dataSource.getRepository(AuthUsersEntity).findOne({ where: [ { email: newEmployee.email }, { employeeId: String(newEmployee.id) } ] });
                            if (authUser) {
                                await this.dataSource.getRepository(AuthUsersEntity).update(authUser.id, { userRole: roleInput as UserRoleEnum });
                            } else {
                                // We don't automatically register user here unless there's logic, but since it's an update,
                                // we can just log or ignore, or we create a skeleton user. Often we just update if exists.
                            }
                        }
                    }

                    successCount++;
                } catch (err: any) {
                    errors.push({ row: i + 1, error: err.message });
                }
            }

            return new BulkImportResponseModel(
                true, 200,
                `Processed ${rows.length - 1} rows. Success: ${successCount}, Failed: ${errors.length}`,
                successCount, errors.length, errors
            );
        } catch (error: any) {
            throw error;
        }
    }
}
