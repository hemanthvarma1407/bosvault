
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { EmployeesEntity } from '../employees/entities/employees.entity';
import { TicketsEntity } from '../tickets/entities/tickets.entity';
import { AssetInfoEntity } from '../asset-info/entities/asset-info.entity';
import { AssetTypeMasterEntity } from '../masters/asset-type/entities/asset-type.entity';
import { DeviceConfigEntity } from '../masters/brand/entities/brand.entity';
import { DepartmentsMasterEntity } from '../masters/department/entities/department.entity';
import { CompanyInfoEntity } from '../masters/company-info/entities/company-info.entity';
import { CompanyLicenseEntity } from '../licenses/entities/company-license.entity';
import { LicensesMasterEntity } from '../masters/license/entities/license.entity';
import { TicketStatusEnum, TicketPriorityEnum, AssetStatusEnum } from '@bosvault/shared-models';

@Injectable()
export class ReportsService {
    constructor(
        private readonly dataSource: DataSource
    ) { }

    private generateExcelBuffer(data: any[]): Buffer {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }

    private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        // Approximate character width (this is a rough estimate)
        const charWidth = fontSize * 0.6;
        const maxCharsPerLine = Math.floor(maxWidth / charWidth);

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length <= maxCharsPerLine) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.length > 0 ? lines : [text.substring(0, maxCharsPerLine)];
    }

    private async generatePdfBuffer(data: any[], reportTitle: string): Promise<Buffer> {
        const pdfDoc = await PDFDocument.create();
        const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const createPage = () => {
            const newPage = pdfDoc.addPage([842, 595]); // A4 landscape
            const { width, height } = newPage.getSize();
            return { page: newPage, width, height };
        };

        let { page, width, height } = createPage();

        const drawHeader = (currentPage: any, currentY: number) => {
            // Title
            currentPage.drawText(reportTitle, {
                x: 50,
                y: height - 40,
                size: 14,
                font: boldFont,
                color: rgb(0.1, 0.1, 0.1),
            });

            // Date
            currentPage.drawText(`Generated: ${new Date().toLocaleString()}`, {
                x: 50,
                y: height - 55,
                size: 8,
                font: timesRomanFont,
                color: rgb(0.4, 0.4, 0.4),
            });

            return height - 80;
        };

        let currentY = drawHeader(page, height);

        if (data && data.length > 0) {
            const headers = Object.keys(data[0]);
            const fontSize = 7;
            const cellPadding = 4;
            const startX = 50;
            const availableWidth = width - 100;
            const columnWidth = Math.min(150, availableWidth / headers.length);
            const baseRowHeight = 20;

            const drawTableHeader = (currentPage: any, y: number) => {
                // Background for header
                currentPage.drawRectangle({
                    x: startX,
                    y: y - baseRowHeight + 5,
                    width: columnWidth * headers.length,
                    height: baseRowHeight,
                    color: rgb(0.9, 0.9, 0.95),
                });

                headers.forEach((header, i) => {
                    const x = startX + (i * columnWidth);
                    currentPage.drawRectangle({
                        x: x,
                        y: y - baseRowHeight + 5,
                        width: columnWidth,
                        height: baseRowHeight,
                        borderColor: rgb(0.6, 0.6, 0.6),
                        borderWidth: 0.5,
                    });

                    const cleanHeader = header.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
                    const lines = this.wrapText(cleanHeader, columnWidth - (cellPadding * 2), fontSize);
                    currentPage.drawText(lines[0] || '', {
                        x: x + cellPadding,
                        y: y - baseRowHeight + 12,
                        size: fontSize,
                        font: boldFont,
                        color: rgb(0.1, 0.1, 0.1),
                    });
                });

                return y - baseRowHeight;
            };

            currentY = drawTableHeader(page, currentY);

            for (let i = 0; i < data.length; i++) {
                if (currentY < 60) {
                    const result = createPage();
                    page = result.page;
                    currentY = drawHeader(page, height);
                    currentY = drawTableHeader(page, currentY);
                }

                const row = data[i];
                headers.forEach((header, colIdx) => {
                    const x = startX + (colIdx * columnWidth);
                    page.drawRectangle({
                        x: x,
                        y: currentY - baseRowHeight + 5,
                        width: columnWidth,
                        height: baseRowHeight,
                        borderColor: rgb(0.8, 0.8, 0.8),
                        borderWidth: 0.3,
                    });

                    const text = String(row[header] ?? '-');
                    const lines = this.wrapText(text, columnWidth - (cellPadding * 2), fontSize);
                    page.drawText(lines[0] || '', {
                        x: x + cellPadding,
                        y: currentY - baseRowHeight + 11,
                        size: fontSize - 0.5,
                        font: timesRomanFont,
                        color: rgb(0.2, 0.2, 0.2),
                    });
                });

                currentY -= baseRowHeight;
            }
        }

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }

    async getAssetReports(format = 'summary') {
        // Use raw query with manual joins
        const rawResults = await this.dataSource.getRepository(AssetInfoEntity)
            .createQueryBuilder('a')
            .leftJoin(AssetTypeMasterEntity, 'd', 'a.deviceId = d.id')
            .leftJoin(DeviceConfigEntity, 'b', 'a.deviceConfigId = b.id')
            .leftJoin(EmployeesEntity, 'e1', 'a.assignedToEmployeeId = e1.id')
            .leftJoin(EmployeesEntity, 'e2', 'a.previousUserEmployeeId = e2.id')
            .select([
                'a.id AS "assetId"',
                'a.serial_number AS "serialNumber"',
                'a.model AS "model"',
                'a.configuration AS "configuration"',
                'a.box_no AS "boxNo"',
                'a.asset_status_enum AS "status"',
                'a.purchase_date AS "purchaseDate"',
                'a.warranty_expiry AS "warrantyExpiry"',
                'a.user_assigned_date AS "userAssignedDate"',
                'a.last_return_date AS "lastReturnDate"',
                'a.created_at AS "createdAt"',
                'a.updated_at AS "updatedAt"',
                'd.name AS "deviceName"',
                'b.laptop_company AS "brandName"',
                "CONCAT(e1.first_name, ' ', e1.last_name) AS \"assignedTo\"",
                'e1.email AS "assignedEmail"',
                "CONCAT(e2.first_name, ' ', e2.last_name) AS \"previousUser\""
            ])
            .orderBy('a.id', 'DESC')
            .getRawMany();

        const formattedAssets = rawResults.map((asset: any) => ({
            'Serial Number': asset.serialNumber,
            'Device Type': asset.deviceName || 'N/A',
            'Brand': asset.brandName || 'N/A',
            'Model': asset.model || 'N/A',
            'Configuration': asset.configuration || 'N/A',
            'Box Number': asset.boxNo || 'N/A',
            'Status': asset.status,
            'Assigned To': asset.assignedTo || 'Unassigned',
            'Assigned Employee Email': asset.assignedEmail || 'N/A',
            'Previous User': asset.previousUser || 'N/A',
            'Purchase Date': asset.purchaseDate || 'N/A',
            'Warranty Expiry': asset.warrantyExpiry || 'N/A',
            'User Assigned Date': asset.userAssignedDate || 'N/A',
            'Last Return Date': asset.lastReturnDate || 'N/A',
            'Created At': asset.createdAt,
            'Updated At': asset.updatedAt,
        }));

        return formattedAssets;
    }

    async getAssetAllocationReports(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(AssetInfoEntity)
            .createQueryBuilder('a')
            .leftJoin(AssetTypeMasterEntity, 'd', 'a.deviceId = d.id')
            .leftJoin(DeviceConfigEntity, 'b', 'a.deviceConfigId = b.id')
            .innerJoin(EmployeesEntity, 'e1', 'a.assignedToEmployeeId = e1.id')
            .leftJoin(DepartmentsMasterEntity, 'dept', 'e1.departmentId = dept.id')
            .select([
                'a.id AS "assetId"',
                'a.serial_number AS "serialNumber"',
                'a.model AS "model"',
                'a.configuration AS "configuration"',
                'a.asset_status_enum AS "status"',
                'a.user_assigned_date AS "userAssignedDate"',
                'd.name AS "deviceName"',
                'b.laptop_company AS "brandName"',
                "CONCAT(e1.first_name, ' ', e1.last_name) AS \"assignedTo\"",
                'e1.email AS "assignedEmail"',
                'e1.ph_number AS "assignedPhone"',
                'dept.name AS "assignedDepartment"'
            ])
            .where('a.assignedToEmployeeId IS NOT NULL')
            .orderBy('e1.first_name', 'ASC')
            .addOrderBy('e1.last_name', 'ASC')
            .addOrderBy('a.id', 'DESC')
            .getRawMany();

        return rawResults.map((asset: any) => ({
            'Serial Number': asset.serialNumber,
            'Device Type': asset.deviceName || 'N/A',
            'Brand': asset.brandName || 'N/A',
            'Model': asset.model || 'N/A',
            'Configuration': asset.configuration || 'N/A',
            'Status': asset.status,
            'Assigned To': asset.assignedTo,
            'Email': asset.assignedEmail || 'N/A',
            'Phone': asset.assignedPhone || 'N/A',
            'Department': asset.assignedDepartment || 'N/A',
            'Assigned Date': asset.userAssignedDate || 'N/A'
        }));
    }

    async getEmployeeReports(format = 'summary') {
        if (format === 'summary') {
            const empRepo = this.dataSource.getRepository(EmployeesEntity);
            const totalEmployees = await empRepo.count();
            return { totalEmployees };
        }

        const rawResults = await this.dataSource.getRepository(EmployeesEntity)
            .createQueryBuilder('e')
            .leftJoin(DepartmentsMasterEntity, 'd', 'e.departmentId = d.id')
            .leftJoin(CompanyInfoEntity, 'c', 'e.companyId = c.id')
            .select([
                'e.id AS "id"',
                'e.first_name AS "firstName"',
                'e.last_name AS "lastName"',
                'e.email AS "email"',
                'e.ph_number AS "phone"',
                'e.emp_status AS "status"',
                'e.created_at AS "joinDate"',
                'd.name AS "departmentName"',
                'c.company_name AS "companyName"'
            ])
            .orderBy('e.id', 'DESC')
            .getRawMany();

        return rawResults.map((emp: any) => ({
            'Full Name': `${emp.firstName} ${emp.lastName}`,
            'Email': emp.email,
            'Phone': emp.phone || 'N/A',
            'Department': emp.departmentName || 'N/A',
            'Company': emp.companyName || 'N/A',
            'Status': emp.status,
            'Join Date': emp.joinDate
        }));
    }

    async getTicketReports(format = 'summary') {
        if (format === 'summary') {
            const ticketRepo = this.dataSource.getRepository(TicketsEntity);
            const totalTickets = await ticketRepo.count();
            const ticketsByStatus = await ticketRepo.createQueryBuilder('ticket')
                .select('ticket.ticketStatus, COUNT(ticket.id) as count')
                .groupBy('ticket.ticketStatus')
                .getRawMany();
            return { totalTickets, ticketsByStatus };
        }

        const rawResults = await this.dataSource.getRepository(TicketsEntity)
            .createQueryBuilder('t')
            .leftJoin(EmployeesEntity, 'e1', 't.employeeId = e1.id')
            .leftJoin(EmployeesEntity, 'e2', 't.assignAdminId = e2.id')
            .select([
                't.ticket_code AS "ticketCode"',
                't.subject AS "subject"',
                't.priority_enum AS "priority"',
                't.category_enum AS "category"',
                't.ticket_status AS "status"',
                't.created_at AS "createdAt"',
                't.resolved_at AS "resolvedAt"',
                "CONCAT(e1.first_name, ' ', e1.last_name) AS \"raisedBy\"",
                "CONCAT(e2.first_name, ' ', e2.last_name) AS \"assignedTo\""
            ])
            .orderBy('t.created_at', 'DESC')
            .getRawMany();

        return rawResults.map((t: any) => ({
            'Ticket Code': t.ticketCode,
            'Subject': t.subject,
            'Priority': t.priority,
            'Category': t.category,
            'Status': t.status,
            'Raised By': t.raisedBy || 'Unknown',
            'Assigned To': t.assignedTo || 'Unassigned',
            'Created At': t.createdAt,
            'Resolved At': t.resolvedAt || 'Pending'
        }));
    }

    // New Asset Reports
    async getAssetWarrantyExpiryReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(AssetInfoEntity)
            .createQueryBuilder('a')
            .leftJoin(AssetTypeMasterEntity, 'd', 'a.deviceId = d.id')
            .leftJoin(DeviceConfigEntity, 'b', 'a.deviceConfigId = b.id')
            .leftJoin(EmployeesEntity, 'e1', 'a.assignedToEmployeeId = e1.id')
            .select([
                'a.id AS "assetId"',
                'a.serial_number AS "serialNumber"',
                'a.model AS "model"',
                'a.warranty_expiry::date AS "warrantyExpiry"',
                'a.purchase_date::date AS "purchaseDate"',
                'd.name AS "deviceName"',
                'b.laptop_company AS "brandName"',
                "CONCAT(e1.first_name, ' ', e1.last_name) AS \"assignedTo\"",
                '(a.warranty_expiry::date - CURRENT_DATE) AS "daysUntilExpiry"'
            ])
            .where('a.warranty_expiry IS NOT NULL')
            .andWhere('a.warranty_expiry::date >= CURRENT_DATE')
            .orderBy('a.warranty_expiry::date', 'ASC')
            .getRawMany();

        return rawResults.map((asset: any) => ({
            'Serial Number': asset.serialNumber,
            'Device Type': asset.deviceName || 'N/A',
            'Device Configuration': asset.brandName || 'N/A',
            'Model': asset.model || 'N/A',
            'Assigned To': asset.assignedTo || 'Unassigned',
            'Purchase Date': asset.purchaseDate || 'N/A',
            'Warranty Expiry': asset.warrantyExpiry,
            'Days Until Expiry': asset.daysUntilExpiry
        }));
    }

    async getAssetByDepartmentReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(AssetInfoEntity)
            .createQueryBuilder('a')
            .innerJoin(EmployeesEntity, 'e', 'a.assignedToEmployeeId = e.id')
            .innerJoin(DepartmentsMasterEntity, 'dept', 'e.departmentId = dept.id')
            .leftJoin(AssetTypeMasterEntity, 'd', 'a.deviceId = d.id')
            .leftJoin(DeviceConfigEntity, 'b', 'a.deviceConfigId = b.id')
            .select([
                'dept.name AS "departmentName"',
                'd.name AS "deviceName"',
                'b.laptop_company AS "brandName"',
                'COUNT(a.id) AS "assetCount"',
                "STRING_AGG(a.serial_number, ', ') AS \"serialNumbers\""
            ])
            .where('a.assignedToEmployeeId IS NOT NULL')
            .groupBy('dept.name')
            .addGroupBy('d.name')
            .addGroupBy('b.laptop_company')
            .orderBy('dept.name', 'ASC')
            .addOrderBy('"assetCount"', 'DESC')
            .getRawMany();

        return rawResults.map((row: any) => ({
            'Department': row.departmentName,
            'Device Type': row.deviceName || 'N/A',
            'Device Configuration': row.brandName || 'N/A',
            'Asset Count': row.assetCount,
            'Serial Numbers': row.serialNumbers
        }));
    }

    async getAssetByDeviceTypeReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(AssetInfoEntity)
            .createQueryBuilder('a')
            .leftJoin(AssetTypeMasterEntity, 'd', 'a.deviceId = d.id')
            .leftJoin(DeviceConfigEntity, 'b', 'a.deviceConfigId = b.id')
            .select([
                'd.name AS "deviceName"',
                'b.laptop_company AS "brandName"',
                'a.model AS "model"',
                'a.asset_status_enum AS "status"',
                'COUNT(a.id) AS "totalAssets"',
                'SUM(CASE WHEN a.assigned_to_employee_id IS NOT NULL THEN 1 ELSE 0 END) AS "assignedCount"',
                'SUM(CASE WHEN a.assigned_to_employee_id IS NULL THEN 1 ELSE 0 END) AS "unassignedCount"'
            ])
            .groupBy('d.name')
            .addGroupBy('b.laptop_company')
            .addGroupBy('a.model')
            .addGroupBy('a.asset_status_enum')
            .orderBy('d.name', 'ASC')
            .addOrderBy('"totalAssets"', 'DESC')
            .getRawMany();

        return rawResults.map((row: any) => ({
            'Device Type': row.deviceName || 'N/A',
            'Device Configuration': row.brandName || 'N/A',
            'Model': row.model || 'N/A',
            'Status': row.status,
            'Total Assets': row.totalAssets,
            'Assigned': row.assignedCount,
            'Unassigned': row.unassignedCount
        }));
    }

    async getUnassignedAssetsReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(AssetInfoEntity)
            .createQueryBuilder('a')
            .leftJoin(AssetTypeMasterEntity, 'd', 'a.deviceId = d.id')
            .leftJoin(DeviceConfigEntity, 'b', 'a.deviceConfigId = b.id')
            .select([
                'a.id AS "assetId"',
                'a.serial_number AS "serialNumber"',
                'a.model AS "model"',
                'a.configuration AS "configuration"',
                'a.asset_status_enum AS "status"',
                'a.purchase_date AS "purchaseDate"',
                'd.name AS "deviceName"',
                'b.laptop_company AS "brandName"'
            ])
            .where('a.assignedToEmployeeId IS NULL')
            .orderBy('a.created_at', 'DESC')
            .getRawMany();

        return rawResults.map((asset: any) => ({
            'Serial Number': asset.serialNumber,
            'Device Type': asset.deviceName || 'N/A',
            'Device Configuration': asset.brandName || 'N/A',
            'Model': asset.model || 'N/A',
            'Configuration': asset.configuration || 'N/A',
            'Status': asset.status,
            'Purchase Date': asset.purchaseDate || 'N/A'
        }));
    }

    // Employee Reports
    async getEmployeesByDepartmentReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(EmployeesEntity)
            .createQueryBuilder('e')
            .leftJoin(DepartmentsMasterEntity, 'dept', 'e.departmentId = dept.id')
            .select([
                'dept.name AS "departmentName"',
                'COUNT(e.id) AS "employeeCount"',
                "STRING_AGG(CONCAT(e.first_name, ' ', e.last_name), ', ') AS \"employees\""
            ])
            .groupBy('dept.name')
            .orderBy('"employeeCount"', 'DESC')
            .getRawMany();

        return rawResults.map((row: any) => ({
            'Department': row.departmentName || 'Unassigned',
            'Employee Count': row.employeeCount,
            'Employees': row.employees
        }));
    }

    // Ticket Reports
    async getOpenTicketsReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(TicketsEntity)
            .createQueryBuilder('t')
            .leftJoin(EmployeesEntity, 'e1', 't.employeeId = e1.id')
            .leftJoin(EmployeesEntity, 'e2', 't.assignAdminId = e2.id')
            .select([
                't.ticket_code AS "ticketCode"',
                't.subject AS "subject"',
                't.priority_enum AS "priority"',
                't.category_enum AS "category"',
                't.ticket_status AS "status"',
                't.created_at AS "createdAt"',
                "CONCAT(e1.first_name, ' ', e1.last_name) AS \"raisedBy\"",
                "CONCAT(e2.first_name, ' ', e2.last_name) AS \"assignedTo\"",
                '(CURRENT_DATE - t.created_at::date) AS "daysOpen"'
            ])
            .where('t.ticket_status NOT IN (:...statuses)', { statuses: [TicketStatusEnum.RESOLVED, TicketStatusEnum.CLOSED] })
            .orderBy('t.priority_enum', 'DESC')
            .addOrderBy('t.created_at', 'ASC')
            .getRawMany();

        return rawResults.map((t: any) => ({
            'Ticket Code': t.ticketCode,
            'Subject': t.subject,
            'Priority': t.priority,
            'Category': t.category,
            'Status': t.status,
            'Raised By': t.raisedBy || 'Unknown',
            'Assigned To': t.assignedTo || 'Unassigned',
            'Created At': t.createdAt,
            'Days Open': t.daysOpen
        }));
    }

    async getResolvedTicketsReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(TicketsEntity)
            .createQueryBuilder('t')
            .leftJoin(EmployeesEntity, 'e1', 't.employeeId = e1.id')
            .leftJoin(EmployeesEntity, 'e2', 't.assignAdminId = e2.id')
            .select([
                't.ticket_code AS "ticketCode"',
                't.subject AS "subject"',
                't.priority_enum AS "priority"',
                't.category_enum AS "category"',
                't.created_at AS "createdAt"',
                't.resolved_at AS "resolvedAt"',
                "CONCAT(e1.first_name, ' ', e1.last_name) AS \"raisedBy\"",
                "CONCAT(e2.first_name, ' ', e2.last_name) AS \"resolvedBy\"",
                '(t.resolved_at::date - t.created_at::date) AS "resolutionDays"'
            ])
            .where('t.ticket_status IN (:...statuses)', { statuses: [TicketStatusEnum.RESOLVED, TicketStatusEnum.CLOSED] })
            .orderBy('t.resolvedAt', 'DESC')
            .getRawMany();

        return rawResults.map((t: any) => ({
            'Ticket Code': t.ticketCode,
            'Subject': t.subject,
            'Priority': t.priority,
            'Category': t.category,
            'Raised By': t.raisedBy || 'Unknown',
            'Resolved By': t.resolvedBy || 'Unknown',
            'Created At': t.createdAt,
            'Resolved At': t.resolvedAt,
            'Resolution Days': t.resolutionDays
        }));
    }

    async getTicketsByPriorityReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(TicketsEntity)
            .createQueryBuilder('t')
            .select([
                't.priority_enum AS "priority"',
                't.ticket_status AS "status"',
                'COUNT(t.id) AS "ticketCount"',
                'AVG(COALESCE(t.resolved_at::date, CURRENT_DATE) - t.created_at::date) AS "avgResolutionDays"'
            ])
            .groupBy('t.priority_enum')
            .addGroupBy('t.ticketStatus')
            .orderBy(
                `CASE t.priority_enum::text
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END`,
                'ASC'
            )
            .addOrderBy('t.ticketStatus', 'ASC')
            .getRawMany();

        return rawResults.map((row: any) => ({
            'Priority': row.priority,
            'Status': row.status,
            'Ticket Count': row.ticketCount,
            'Avg Resolution Days': Math.round(row.avgResolutionDays || 0)
        }));
    }

    async getTicketsByCategoryReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(TicketsEntity)
            .createQueryBuilder('t')
            .select([
                't.category_enum AS "category"',
                't.ticket_status AS "status"',
                'COUNT(t.id) AS "ticketCount"',
                'AVG(COALESCE(t.resolved_at::date, CURRENT_DATE) - t.created_at::date) AS "avgResolutionDays"'
            ])
            .groupBy('t.category_enum')
            .addGroupBy('t.ticketStatus')
            .orderBy('"ticketCount"', 'DESC')
            .getRawMany();

        return rawResults.map((row: any) => ({
            'Category': row.category,
            'Status': row.status,
            'Ticket Count': row.ticketCount,
            'Avg Resolution Days': Math.round(row.avgResolutionDays || 0)
        }));
    }

    // Master Data Reports
    async getDepartmentSummaryReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(DepartmentsMasterEntity)
            .createQueryBuilder('d')
            .leftJoin(EmployeesEntity, 'e', 'd.id = e.departmentId')
            .leftJoin(AssetInfoEntity, 'a', 'e.id = a.assignedToEmployeeId')
            .select([
                'd.name AS "departmentName"',
                'COUNT(DISTINCT e.id) AS "employeeCount"',
                'COUNT(DISTINCT a.id) AS "assetCount"'
            ])
            .groupBy('d.name')
            .orderBy('"employeeCount"', 'DESC')
            .getRawMany();

        return rawResults.map((row: any) => ({
            'Department': row.departmentName,
            'Employee Count': row.employeeCount,
            'Asset Count': row.assetCount
        }));
    }

    async getLicenseReports(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(CompanyLicenseEntity)
            .createQueryBuilder('l')
            .leftJoin(CompanyInfoEntity, 'c', 'l.companyId = c.id')
            .leftJoin(LicensesMasterEntity, 'a', 'l.applicationId = a.id')
            .leftJoin(EmployeesEntity, 'e', 'l.assignedEmployeeId = e.id')
            .select([
                'l.id AS "id"',
                'l.license_key AS "licenseKey"',
                'l.purchase_date AS "purchaseDate"',
                'l.assigned_date AS "assignedDate"',
                'l.expiry_date AS "expiryDate"',
                'l.remarks AS "remarks"',
                'c.company_name AS "companyName"',
                'a.name AS "softwareName"',
                "CONCAT(e.first_name, ' ', e.last_name) AS \"assignedEmployee\""
            ])
            .orderBy('l.created_at', 'DESC')
            .getRawMany();

        return rawResults.map((row: any) => ({
            'Software': row.softwareName || 'N/A',
            'License Key': row.licenseKey || '---',
            'Company': row.companyName || 'N/A',
            'Assigned Employee': row.assignedEmployee || 'Unassigned',
            'Purchase Date': row.purchaseDate || 'N/A',
            'Assigned Date': row.assignedDate || 'N/A',
            'Expiry Date': row.expiryDate || 'N/A',
            'Remarks': row.remarks || '---'
        }));
    }

    async getDeviceConfigsReport(format = 'summary') {
        const rawResults = await this.dataSource.getRepository(DeviceConfigEntity)
            .createQueryBuilder('b')
            .leftJoin(AssetInfoEntity, 'a', 'b.id = a.deviceConfigId')
            .leftJoin(AssetTypeMasterEntity, 'd', 'a.deviceId = d.id')
            .select([
                'b.laptop_company AS "brandName"',
                'd.name AS "deviceType"',
                'COUNT(a.id) AS "assetCount"'
            ])
            .groupBy('b.laptop_company')
            .addGroupBy('d.name')
            .orderBy('"assetCount"', 'DESC')
            .getRawMany();

        return rawResults.map((row: any) => ({
            'Device Configuration': row.brandName,
            'Device Type': row.deviceType || 'N/A',
            'Asset Count': row.assetCount
        }));
    }

    async generateReport(type: string, filters: any, userId?: number, ipAddress?: string) {
        const format = filters.format || 'summary';
        let data: any;

        // Check format
        const isExcel = format === 'excel';
        const isPdf = format === 'pdf';
        const fetchFormat = (isExcel || isPdf) ? 'detailed' : format;

        switch (type) {
            case 'Asset Inventory Report':
                data = await this.getAssetReports(fetchFormat);
                break;
            case 'Asset Allocation Report':
                data = await this.getAssetAllocationReports(fetchFormat);
                break;
            case 'Asset Warranty Expiry Report':
                data = await this.getAssetWarrantyExpiryReport(fetchFormat);
                break;
            case 'Asset by Department Report':
                data = await this.getAssetByDepartmentReport(fetchFormat);
                break;
            case 'Asset by Device Type Report':
                data = await this.getAssetByDeviceTypeReport(fetchFormat);
                break;
            case 'Unassigned Assets Report':
                data = await this.getUnassignedAssetsReport(fetchFormat);
                break;
            case 'Employee Directory':
                data = await this.getEmployeeReports(fetchFormat);
                break;
            case 'Employees by Department Report':
                data = await this.getEmployeesByDepartmentReport(fetchFormat);
                break;
            case 'License Assignment Report':
                data = await this.getLicenseReports(fetchFormat);
                break;
            case 'Ticket Summary Report':
                data = await this.getTicketReports(fetchFormat);
                break;
            case 'Open Tickets Report':
                data = await this.getOpenTicketsReport(fetchFormat);
                break;
            case 'Resolved Tickets Report':
                data = await this.getResolvedTicketsReport(fetchFormat);
                break;
            case 'Tickets by Priority Report':
                data = await this.getTicketsByPriorityReport(fetchFormat);
                break;
            case 'Tickets by Category Report':
                data = await this.getTicketsByCategoryReport(fetchFormat);
                break;
            case 'Department Summary Report':
                data = await this.getDepartmentSummaryReport(fetchFormat);
                break;
            case 'Device Brands Report':
            case 'Device Configuration Report':
                data = await this.getDeviceConfigsReport(fetchFormat);
                break;
            default:
                throw new Error('Report type not implemented');
        }

        if (isExcel) {
            const buffer = this.generateExcelBuffer(data);
            return {
                fileBuffer: buffer,
                fileName: `${type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
        }

        if (isPdf) {
            const buffer = await this.generatePdfBuffer(data, type);
            return {
                fileBuffer: buffer,
                fileName: `${type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                mimeType: 'application/pdf'
            };
        }

        return data;
    }
}
