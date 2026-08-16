import { DataSource, Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { EmployeesEntity } from "../entities/employees.entity";

import { EmployeeStatusEnum } from "@bosvault/shared-models";
import { Not } from "typeorm";

@Injectable()
export class EmployeesRepository extends Repository<EmployeesEntity> {
    constructor(private dataSource: DataSource) {
        super(EmployeesEntity, dataSource.createEntityManager());
    }

    async findAllEmployees(companyId?: number, includeDeactivated?: boolean): Promise<EmployeesEntity[]> {
        const whereClause: any = {};
        if (companyId) {
            whereClause.companyId = companyId;
        }

        if (!includeDeactivated) {
            whereClause.empStatus = Not(EmployeeStatusEnum.DEACTIVATED);
        }

        return await this.find({
            where: whereClause,
            order: { firstName: 'ASC', lastName: 'ASC' }
        });
    }
}
