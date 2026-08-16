import { DataSource, Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { CompanyLicenseEntity } from "../entities/company-license.entity";

@Injectable()
export class LicenseRepository extends Repository<CompanyLicenseEntity> {
    constructor(private dataSource: DataSource) {
        super(CompanyLicenseEntity, dataSource.createEntityManager());
    }

    async findAllWithRelations(companyId?: number): Promise<CompanyLicenseEntity[]> {
        const query = this.createQueryBuilder('license')
            .orderBy('license.createdAt', 'DESC');

        if (companyId) {
            query.where('license.companyId = :companyId', { companyId });
        }

        return await query.getMany();
    }

    async countAssignedSeats(applicationId: number, excludeLicenseId?: number): Promise<number> {
        const query = this.createQueryBuilder('l')
            .where('l.applicationId = :appId', { appId: applicationId })
            .andWhere('l.assignedEmployeeId IS NOT NULL');

        if (excludeLicenseId) {
            query.andWhere('l.id != :id', { id: excludeLicenseId });
        }

        return await query.getCount();
    }
}
