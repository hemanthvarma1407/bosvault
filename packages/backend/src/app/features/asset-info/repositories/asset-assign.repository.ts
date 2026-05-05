import { DataSource, Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { AssetAssignEntity } from "../entities/asset-assign.entity";
import { IdRequestModel } from "@bosvault/shared-models";

@Injectable()
export class AssetAssignRepository extends Repository<AssetAssignEntity> {
    constructor(private dataSource: DataSource) {
        super(AssetAssignEntity, dataSource.createEntityManager());
    }

    async getAllAssignments(reqModel: IdRequestModel) {
        const companyId = reqModel.id;
        const query = this.createQueryBuilder('assign');
        if (companyId) {
            query.where('assign.company_id = :companyId', { companyId });
        }
        return await query.orderBy('assign.created_at', 'DESC').getMany();
    }
}
