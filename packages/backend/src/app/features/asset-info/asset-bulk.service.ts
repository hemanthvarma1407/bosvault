import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { AssetStatusEnum, BulkImportRequestModel, BulkImportResponseModel } from '@bosvault/shared-models';
import { AssetInfoEntity } from './entities/asset-info.entity';
import { GenericTransactionManager } from '../../../database/typeorm-transactions';

@Injectable()
export class AssetBulkService {
    constructor(
        private dataSource: DataSource,
    ) { }

    async processBulkImport(reqModel: BulkImportRequestModel): Promise<BulkImportResponseModel> {
        try {
            const workbook = XLSX.read(reqModel.fileBuffer, { type: 'buffer', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!rows || rows.length < 1) {
                return new BulkImportResponseModel(false, 400, 'File is empty', 0, 0, []);
            }
            const dataRows = rows.slice(1);
            const errors: { row: number; error: string }[] = [];
            let successCount = 0;
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                const rowNumber = i + 2;
                if (!row || row.length === 0) continue;
                // Check if row is empty (sometimes excel has empty rows at the end)
                if (row.every((cell: any) => cell === undefined || cell === null || cell === '')) {
                    continue;
                }

                const transManager = new GenericTransactionManager(this.dataSource);
                try {
                    const assetTypeId = Number(row[0]);
                    const deviceConfigId = Number(row[1]);
                    const model = row[2]?.toString();
                    const serialNumber = row[3]?.toString();
                    const configuration = row[4]?.toString();
                    const purchaseDateRaw = row[5];
                    const statusStr = row[6]?.toString()?.toLowerCase();

                    if (!assetTypeId || !deviceConfigId || !serialNumber) {
                        errors.push({ row: rowNumber, error: 'Asset Type ID, Device Configuration ID and Serial Number are required' });
                        continue;
                    }

                    await transManager.startTransaction();
                    // Check for duplicate serial number
                    const existing = await transManager.getRepository(AssetInfoEntity).findOne({ where: { serialNumber } });
                    if (existing) {
                        throw new Error(`Serial number ${serialNumber} already exists`);
                    }

                    let status = AssetStatusEnum.AVAILABLE;
                    if (statusStr === 'in_use' || statusStr === 'in use') status = AssetStatusEnum.IN_USE;
                    else if (statusStr === 'retired') status = AssetStatusEnum.RETIRED;

                    let purchaseDate: Date | null = null;
                    if (purchaseDateRaw) {
                        if (purchaseDateRaw instanceof Date) {
                            purchaseDate = purchaseDateRaw;
                        } else {
                            const date = new Date(purchaseDateRaw);
                            if (!isNaN(date.getTime())) purchaseDate = date;
                        }
                    }

                    const newAsset = new AssetInfoEntity();
                    newAsset.companyId = reqModel.companyId;
                    newAsset.deviceId = assetTypeId;
                    newAsset.deviceConfigId = deviceConfigId;
                    newAsset.model = model || '';
                    newAsset.serialNumber = serialNumber;
                    newAsset.configuration = configuration || '';
                    newAsset.purchaseDate = purchaseDate;
                    newAsset.assetStatusEnum = status;
                    newAsset.userId = reqModel.userId;

                    await transManager.getRepository(AssetInfoEntity).save(newAsset);
                    await transManager.completeTransaction();
                    successCount++;
                } catch (err: any) {
                    await transManager.releaseTransaction();
                    let errorMessage = err.message || 'Unknown error';
                    if (errorMessage.includes('foreign key constraint')) {
                        errorMessage = 'Invalid Asset Type ID or Device Configuration ID (Foreign Key Violation)';
                    }
                    errors.push({ row: rowNumber, error: errorMessage });
                }
            }

            const totalProcessed = dataRows.length;
            const message = `Bulk import completed. Total processed: ${totalProcessed}. Success: ${successCount}, Failed: ${errors.length}`;
            return new BulkImportResponseModel(errors.length === 0, 200, message, successCount, errors.length, errors);
        } catch (error) {
            throw error;
        }
    }
}
