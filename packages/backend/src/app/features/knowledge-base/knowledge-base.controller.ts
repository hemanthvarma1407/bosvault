import { Controller, Post, Body, UseGuards, UploadedFile, UseInterceptors, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { ApiTags, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateArticleRequestModel, UpdateArticleRequestModel, SearchArticleRequestModel, GlobalResponse, GetKnowledgeArticleResponseModel, GetAllKnowledgeArticlesResponseModel, GetKnowledgeBaseStatsResponseModel, IdRequestModel } from '@bosvault/shared-models';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { returnException } from '@bosvault/backend-utils';

@ApiTags('Knowledge Base')
@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
    constructor(private service: KnowledgeBaseService) { }

    @Post('createArticle')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async createArticle(@UploadedFile() file: Express.Multer.File, @Body() reqModel: CreateArticleRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.createArticle(reqModel, file);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('updateArticle')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async updateArticle(@UploadedFile() file: Express.Multer.File, @Body() reqModel: UpdateArticleRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.updateArticle(reqModel, file);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('deleteArticle')
    @ApiBody({ type: IdRequestModel })
    async deleteArticle(@Body() reqModel: IdRequestModel): Promise<GlobalResponse> {
        try {
            return await this.service.deleteArticle(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getArticle')
    @ApiBody({ type: IdRequestModel })
    async getArticle(@Body() reqModel: IdRequestModel): Promise<GetKnowledgeArticleResponseModel> {
        try {
            return await this.service.getArticle(reqModel);
        } catch (error) {
            return returnException(GetKnowledgeArticleResponseModel, error);
        }
    }

    @Post('searchArticles')
    @ApiBody({ type: SearchArticleRequestModel })
    async searchArticles(@Body() reqModel: SearchArticleRequestModel): Promise<GetAllKnowledgeArticlesResponseModel> {
        try {
            return await this.service.searchArticles(reqModel);
        } catch (error) {
            return returnException(GetAllKnowledgeArticlesResponseModel, error);
        }
    }

    @Post('getStats')
    @ApiBody({ type: IdRequestModel })
    async getStats(@Body() reqModel: IdRequestModel): Promise<GetKnowledgeBaseStatsResponseModel> {
        try {
            return await this.service.getStats(reqModel);
        } catch (error) {
            return returnException(GetKnowledgeBaseStatsResponseModel, error);
        }
    }

    @Get('download/:fileName')
    async downloadAttachment(@Param('fileName') fileName: string, @Res() res: express.Response) {
        try {
            const filePath = this.service.getAttachmentPath(fileName);
            res.download(filePath, fileName.split('-').slice(1).join('-') || fileName);
        } catch (error) {
            res.status(404).json({ status: false, message: 'File not found' });
        }
    }
}
