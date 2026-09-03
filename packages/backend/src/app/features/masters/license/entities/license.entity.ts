import { Column, Entity } from 'typeorm';
import { MasterBaseEntity } from '../../../../../database/master-base.entity';

@Entity('license_masters')
export class LicensesMasterEntity extends MasterBaseEntity {
    @Column('varchar', { name: 'name', length: 255, nullable: false, comment: 'License name' })
    name: string;

    @Column('text', { name: 'description', nullable: true, comment: 'License description' })
    description: string;

    @Column('boolean', { name: 'is_active', nullable: false, default: true, comment: 'Whether license is active' })
    isActive: boolean;

    @Column('date', { name: 'purchase_date', nullable: true, comment: 'License pushase date' })
    purchaseDate: Date;

    @Column('date', { name: 'expiry_date', nullable: true, comment: 'License expiry date' })
    expiryDate: Date;

    @Column('int', { name: 'total_quantity', default: 0, nullable: true, comment: 'Total number of licenses available' })
    totalQuantity: number;

    @Column('int', { name: 'used_count', default: 0, nullable: true, comment: 'Total number of licenses assigned to members' })
    usedCount: number;

    @Column('decimal', { name: 'price', precision: 12, scale: 2, default: 0, nullable: true, comment: 'Price per license unit' })
    price: number;

    @Column('varchar', { name: 'subscription_plan', length: 100, nullable: true, default: 'Standard', comment: 'Subscription Plan tier (e.g. Free, Starter, Pro, Enterprise)' })
    subscriptionPlan: string;

    @Column('boolean', { name: 'is_paid', nullable: false, default: true, comment: 'Whether license is Paid or Free' })
    isPaid: boolean;

    @Column('varchar', { name: 'billing_cycle', length: 50, nullable: true, default: 'MONTHLY', comment: 'Billing frequency' })
    billingCycle: string;

    @Column('varchar', { name: 'currency', length: 10, nullable: true, default: 'USD', comment: 'Currency code' })
    currency: string;
}
