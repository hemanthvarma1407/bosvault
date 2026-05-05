import { Column, Entity, DeleteDateColumn } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';
import { AssetStatusEnum, ComplianceStatusEnum, EncryptionStatusEnum } from '@bosvault/shared-models';

@Entity('asset_info')
export class AssetInfoEntity extends CommonBaseEntity {
    @Column('bigint', { name: 'device_id', nullable: false, comment: 'Reference to device_info table' })
    deviceId: number;

    @Column('bigint', { name: 'device_config_id', nullable: true, comment: 'Reference to device_configurations master table' })
    deviceConfigId: number;

    @Column('varchar', { name: 'model', length: 255, nullable: true, comment: 'Asset model' })
    model: string;

    @Column('varchar', { name: 'serial_number', length: 255, nullable: false, unique: true, comment: 'Asset serial number / Service Tag' })
    serialNumber: string;

    @Column('varchar', { name: 'box_no', length: 100, nullable: true, comment: 'Physical box/storage location number' })
    boxNo: string;

    @Column('text', { name: 'configuration', nullable: true, comment: 'Asset configuration details' })
    configuration: string;

    @Column('bigint', { name: 'assigned_to_employee_id', nullable: true, comment: 'Reference to employees table - current user' })
    assignedToEmployeeId: number | null;

    @Column('bigint', { name: 'previous_user_employee_id', nullable: true, comment: 'Reference to employees table - previous user' })
    previousUserEmployeeId: number | null;

    @Column('varchar', { name: 'purchase_date', nullable: true, comment: 'Asset purchase date' })
    purchaseDate: Date | null;

    @Column('varchar', { name: 'warranty_expiry', nullable: true, comment: 'Warranty expiration date' })
    warrantyExpiry: Date | null;

    @Column('enum', { name: 'asset_status_enum', enum: AssetStatusEnum, default: AssetStatusEnum.AVAILABLE, nullable: false, comment: 'Current asset status' })
    assetStatusEnum: AssetStatusEnum;

    @Column('date', { name: 'user_assigned_date', nullable: true, comment: 'Date when asset was assigned to current user' })
    userAssignedDate: Date | null;

    @Column('date', { name: 'last_return_date', nullable: true, comment: 'Date when asset was last returned' })
    lastReturnDate: Date | null;

    @Column('enum', { name: 'compliance_status', enum: ComplianceStatusEnum, default: ComplianceStatusEnum.UNKNOWN, nullable: true, comment: 'Device compliance status' })
    complianceStatus: ComplianceStatusEnum;

    @Column('timestamp', { name: 'last_sync', nullable: true, comment: 'Last device sync time' })
    lastSync: Date | null;

    @Column('enum', { name: 'encryption_status', enum: EncryptionStatusEnum, default: EncryptionStatusEnum.UNKNOWN, nullable: true, comment: 'Disk encryption status' })
    encryptionStatus: EncryptionStatusEnum;

    @Column('int', { name: 'battery_level', nullable: true, comment: 'Battery level percentage' })
    batteryLevel: number | null;

    @Column('varchar', { name: 'storage_available', length: 20, nullable: true, comment: 'Available storage capacity' })
    storageAvailable: string;

    @Column('decimal', { name: 'purchase_cost', precision: 12, scale: 2, nullable: true, default: 0 })
    purchaseCost: number;

    @Column('decimal', { name: 'current_value', precision: 12, scale: 2, nullable: true, default: 0 })
    currentValue: number;

    @Column('varchar', { name: 'depreciation_method', nullable: true, default: 'STRAIGHT_LINE' })
    depreciationMethod: string; // STRAIGHT_LINE or DECLINING

    @Column('int', { name: 'useful_life_years', nullable: true, default: 5 })
    usefulLifeYears: number;

    @Column('decimal', { name: 'salvage_value', precision: 12, scale: 2, nullable: true, default: 0 })
    salvageValue: number;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date;
}
