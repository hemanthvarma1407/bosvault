import { Entity, Column, Index } from 'typeorm';
import { MasterBaseEntity } from '../../../../../database/master-base.entity';

@Entity('departments')
@Index('idx_dept_name', ['name'])
export class DepartmentsMasterEntity extends MasterBaseEntity {

    @Column('varchar', { name: 'name', length: 255, nullable: false, comment: 'Department name' })
    name: string;

    @Column('varchar', { name: 'code', length: 100, nullable: true, comment: 'Department code' })
    code: string | null;

    @Column('text', { name: 'description', nullable: true, comment: 'Department description' })
    description: string;

    @Column('boolean', { name: 'is_active', nullable: false, default: true, comment: 'Whether department is active' })
    isActive: boolean;


}
