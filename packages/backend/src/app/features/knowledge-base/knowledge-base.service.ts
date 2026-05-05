import { Injectable } from '@nestjs/common';
import { KnowledgeItemsRepository } from './repositories/knowledge-items.repository';
import { CreateArticleRequestModel, UpdateArticleRequestModel, SearchArticleRequestModel, GlobalResponse, GetKnowledgeArticleResponseModel, GetAllKnowledgeArticlesResponseModel, GetKnowledgeBaseStatsResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { ErrorResponse } from '@bosvault/backend-utils';
import { AuthUsersService } from '../auth-users/auth-users.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class KnowledgeBaseService {
    private readonly uploadPath = path.resolve(__dirname, '../../../../../../uploads/knowledge-base');

    constructor(
        private repo: KnowledgeItemsRepository,
        private authService: AuthUsersService
    ) {
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async createArticle(reqModel: CreateArticleRequestModel, file?: Express.Multer.File): Promise<GlobalResponse> {
        try {
            await this.authService.getMe(Number(reqModel.authorId));
            let fileUrl = '';
            if (file) {
                const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const fileName = `${Date.now()}-${sanitizedOriginalName}`;
                const filePath = path.join(this.uploadPath, fileName);
                fs.writeFileSync(filePath, file.buffer);
                fileUrl = fileName; // We store just the filename, frontend can construct the download URL
            }

            const { authorId, tags, isPublished, ...rest } = reqModel;
            const parsedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? (tags as string).split(',').filter(t => t.trim()) : []);
            const entity = this.repo.create({
                ...rest,
                userId: authorId ? Number(authorId) : null,
                companyId: reqModel.companyId ? Number(reqModel.companyId) : null,
                isPublished: isPublished === undefined ? true : (String(isPublished) === 'true' || isPublished === true),
                tags: parsedTags,
                viewCount: 0,
                fileUrl
            });
            await this.repo.save(entity);
            return new GlobalResponse(true, 201, 'Article created successfully');
        } catch (error) {
            throw error;
        }
    }

    async updateArticle(reqModel: UpdateArticleRequestModel, file?: Express.Multer.File): Promise<GlobalResponse> {
        try {
            const existing = await this.repo.findOne({ where: { id: reqModel.id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Article not found');
            }
            let fileUrl = existing.fileUrl;
            if (file) {
                // Delete old file if exists
                if (existing.fileUrl) {
                    const oldPath = path.join(this.uploadPath, existing.fileUrl);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const fileName = `${Date.now()}-${sanitizedOriginalName}`;
                const filePath = path.join(this.uploadPath, fileName);
                fs.writeFileSync(filePath, file.buffer);
                fileUrl = fileName;
            }

            const { editorId, id, ...rest } = reqModel;
            await this.repo.update(id, {
                ...rest,
                fileUrl
            });
            return new GlobalResponse(true, 200, 'Article updated successfully');
        } catch (error) {
            throw error;
        }
    }

    async deleteArticle(reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            const id = reqModel.id;
            const existing = await this.repo.findOne({ where: { id } });
            if (!existing) {
                throw new ErrorResponse(404, 'Article not found');
            }
            await this.repo.delete(id);
            return new GlobalResponse(true, 200, 'Article deleted successfully');
        } catch (error) {
            throw error;
        }
    }

    async getArticle(reqModel: IdRequestModel): Promise<GetKnowledgeArticleResponseModel> {
        try {
            const id = reqModel.id;
            const article = await this.repo.findOne({ where: { id } });
            if (!article) {
                throw new ErrorResponse(404, 'Article not found');
            }
            article.viewCount += 1;
            await this.repo.save(article);
            return new GetKnowledgeArticleResponseModel(true, 200, 'Article retrieved successfully', article as any);
        } catch (error) {
            throw error;
        }
    }

    async searchArticles(reqModel: SearchArticleRequestModel): Promise<GetAllKnowledgeArticlesResponseModel> {
        try {
            const articles = await this.repo.searchArticles(reqModel);
            return new GetAllKnowledgeArticlesResponseModel(true, 200, 'Articles retrieved successfully', articles as any);
        } catch (error) {
            throw error;
        }
    }

    async getStats(reqModel: IdRequestModel): Promise<GetKnowledgeBaseStatsResponseModel> {
        try {
            const stats = await this.repo.getStats(reqModel.id);
            return new GetKnowledgeBaseStatsResponseModel(true, 200, 'Statistics retrieved successfully', stats);
        } catch (error) {
            throw error;
        }
    }

    getAttachmentPath(fileName: string): string {
        const filePath = path.join(this.uploadPath, fileName);
        if (!fs.existsSync(filePath)) {
            throw new ErrorResponse(404, 'File not found');
        }
        return filePath;
    }
}
