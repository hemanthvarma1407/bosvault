import { Column, Entity } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';

@Entity('documents')
export class DocumentEntity extends CommonBaseEntity {
    @Column('bigint', { name: 'company_id', nullable: false, comment: 'Company ID' })
    companyId: number;

    @Column('varchar', { name: 'file_name', length: 255, nullable: false, comment: 'Stored file name' })
    fileName: string;

    @Column('varchar', { name: 'original_name', length: 255, nullable: false, comment: 'Original file name' })
    originalName: string;

    @Column('bigint', { name: 'file_size', nullable: false, comment: 'File size in bytes' })
    fileSize: number;

    @Column('varchar', { name: 'mime_type', length: 100, nullable: false, comment: 'MIME type of the file' })
    mimeType: string;

    @Column('varchar', { name: 'category', length: 100, nullable: true, comment: 'Document category' })
    category: string;

    @Column('varchar', { name: 'file_path', length: 500, nullable: false, comment: 'File storage path' })
    filePath: string;

    @Column('bigint', { name: 'uploaded_by', nullable: false, comment: 'User ID who uploaded' })
    uploadedBy: number;

    @Column('text', { name: 'description', nullable: true, comment: 'Document description' })
    description: string;

    @Column('varchar', { name: 'tags', length: 500, nullable: true, comment: 'Comma-separated tags' })
    tags: string;

    @Column('boolean', { name: 'is_secure', nullable: false, default: false, comment: 'Is document secure?' })
    isSecure: boolean;

    @Column('varchar', { name: 'password', length: 255, nullable: true, comment: 'Password hash' })
    password: string;
}
