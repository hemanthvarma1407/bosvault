import { Entity, Column } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';

@Entity('licenses')
export class CompanyLicenseEntity extends CommonBaseEntity {

    @Column({ name: 'application_id', nullable: false })
    applicationId: number;

    @Column({ name: 'assigned_date', type: 'date', nullable: true })
    assignedDate: Date | null;

    @Column({ name: 'license_key', type: 'varchar', length: 255, nullable: true })
    licenseKey: string | null;

    @Column({ name: 'purchase_date', type: 'date', nullable: true })
    purchaseDate: Date | null;

    @Column({ name: 'expiry_date', type: 'date', nullable: true })
    expiryDate: Date | null;

    @Column({ name: 'remarks', type: 'text', nullable: true })
    remarks: string | null;

    @Column({ name: 'assigned_employee_id', nullable: true })
    assignedEmployeeId: number;

    @Column({ name: 'total_seats', type: 'int', default: 1 })
    totalSeats: number;

    @Column({ name: 'cost_per_seat', type: 'decimal', precision: 12, scale: 2, default: 0 })
    costPerSeat: number;

    @Column({ name: 'billing_cycle', length: 50, default: 'MONTHLY' })
    billingCycle: string;

    @Column({ name: 'role', type: 'varchar', length: 100, nullable: true, comment: 'Role of the employee for this license (Owner, Member, etc.)' })
    role: string | null;
}
