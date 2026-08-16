import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DocumentEntity } from '../entities/document.entity';

@Injectable()
export class DocumentRepository extends Repository<DocumentEntity> {
    constructor(private dataSource: DataSource) {
        super(DocumentEntity, dataSource.createEntityManager());
    }

    async findFilteredDocuments(category?: string, isSecure?: boolean): Promise<DocumentEntity[]> {
        const where: any = {};
        if (category) where.category = category;
        if (isSecure !== undefined) where.isSecure = isSecure;

        return await this.find({
            where,
            order: { createdAt: 'DESC' }
        });
    }
}
