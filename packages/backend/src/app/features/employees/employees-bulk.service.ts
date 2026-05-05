import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { EmployeesEntity } from './entities/employees.entity';
import { EmployeesRepository } from './repositories/employees.repository';
import { DepartmentRepository } from '../masters/department/repositories/department.repository';
import { CompanyInfoEntity } from '../masters/company-info/entities/company-info.entity';
import { EmployeeStatusEnum, BulkImportResponseModel, BulkImportRequestModel } from '@bosvault/shared-models';

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
            const company = await companyRepo.findOne({ where: { id: companyId } });
            if (!company) {
                return new BulkImportResponseModel(false, 400, 'Invalid Company ID', 0, 0, []);
            }
            const expectedCompanyName = company.companyName.toLowerCase().trim();

            // ── Existing employees (for email dedup & manager resolution) ──
            const existingEmployees = await this.employeesRepo.find({ where: { companyId } });
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
                    // Col 0-8 (same as before), Col 9 = optional company name
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

                    // ── Required fields ───────────────────────────────────
                    if (!firstName) throw new Error('First Name is required');
                    if (!lastName) throw new Error('Last Name is required');
                    if (!email) throw new Error('Email is required');

                    // ── Company name validation (optional column) ─────────
                    if (rowCompanyName) {
                        if (rowCompanyName.toLowerCase() !== expectedCompanyName) {
                            throw new Error(
                                `Company name '${rowCompanyName}' does not match the selected company '${company.companyName}'.`
                            );
                        }
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
                    }
                    if (!resolvedDepartmentId) {
                        throw new Error(`Department '${depInput}' not found. Use a valid Department Name or ID.`);
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

                    // ── Save ──────────────────────────────────────────────
                    const newEmployee = new EmployeesEntity();
                    newEmployee.companyId = companyId;
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
                    newEmployee.createdAt = new Date();

                    await this.employeesRepo.save(newEmployee);

                    // Update in-memory maps so later rows can reference this new employee as manager
                    existingEmailSet.add(email.toLowerCase());
                    emailToIdMap.set(email.toLowerCase(), newEmployee.id);
                    nameToIdMap.set(`${firstName} ${lastName}`.toLowerCase(), newEmployee.id);
                    idSet.add(newEmployee.id);

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
