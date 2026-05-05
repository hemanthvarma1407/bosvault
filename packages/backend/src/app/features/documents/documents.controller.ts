import { Body, Controller, Post, Get, Param, Res, UploadedFile, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiTags, ApiConsumes } from '@nestjs/swagger';
import express from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentModel, DeleteDocumentModel, GetDocumentModel, GetAllDocumentsResponseModel, GetDocumentResponseModel, UploadDocumentResponseModel, GetAllDocumentsRequestModel, DownloadDocumentRequestModel, GlobalResponse } from '@bosvault/shared-models';
import { returnException } from '@bosvault/backend-utils';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
    constructor(private readonly service: DocumentsService) { }

    @Post('uploadDocument')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(@UploadedFile() file: Express.Multer.File, @Body() reqModel: UploadDocumentModel): Promise<UploadDocumentResponseModel> {
        try {
            return await this.service.uploadDocument(reqModel, file);
        } catch (error) {
            return returnException(UploadDocumentResponseModel, error);
        }
    }

    @Post('deleteDocument')
    @ApiBody({ type: DeleteDocumentModel })
    async deleteDocument(@Body() reqModel: DeleteDocumentModel): Promise<GlobalResponse> {
        try {
            return await this.service.deleteDocument(reqModel);
        } catch (error) {
            return returnException(GlobalResponse, error);
        }
    }

    @Post('getDocument')
    @ApiBody({ type: GetDocumentModel })
    async getDocument(@Body() reqModel: GetDocumentModel): Promise<GetDocumentResponseModel> {
        try {
            return await this.service.getDocument(reqModel);
        } catch (error) {
            return returnException(GetDocumentResponseModel, error);
        }
    }

    @Post('getAllDocuments')
    @ApiBody({ type: GetAllDocumentsRequestModel })
    async getAllDocuments(@Body() reqModel: GetAllDocumentsRequestModel): Promise<GetAllDocumentsResponseModel> {
        try {
            return await this.service.getAllDocuments(reqModel);
        } catch (error) {
            return returnException(GetAllDocumentsResponseModel, error);
        }
    }

    @Get('downloadDocument/:id')
    async downloadDocumentGet(@Param('id', ParseIntPipe) id: number, @Res() res: express.Response) {
        try {
            console.log(`[DEBUG-DOC] Attempting download for ID: ${id}`);
            const reqModel: DownloadDocumentRequestModel = { id };
            const response = await this.service.downloadDocument(reqModel);
            console.log(`[DEBUG-DOC] Serving file: ${response.filePath} as ${response.mimeType}`);

            res.setHeader('Content-Type', response.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${response.originalName}"`);
            res.sendFile(response.filePath);
        } catch (error) {
            console.error(`[DEBUG-DOC] Download failed for ID: ${id}`, error);
            res.status(500).json(returnException(GlobalResponse, error));
        }
    }

    @Post('download')
    @ApiBody({ type: DownloadDocumentRequestModel })
    async downloadDocumentPost(@Body() reqModel: DownloadDocumentRequestModel, @Res() res: express.Response) {
        try {
            const response = await this.service.downloadDocument(reqModel);
            res.download(response.filePath, response.originalName);
        } catch (error) {
            res.status(500).json(returnException(GlobalResponse, error));
        }
    }
}
