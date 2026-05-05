import { AxiosInstance } from "../axios-instance";
import { CommonAxiosService } from "../common-axios-service";
import { AxiosRequestConfig } from "axios";
import { DeleteDocumentModel, GetDocumentModel, GetAllDocumentsResponseModel, GetDocumentResponseModel, UploadDocumentResponseModel, UploadDocumentModel, GlobalResponse, GetAllDocumentsRequestModel } from '@bosvault/shared-models';

export class DocumentsService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/documents/' + childUrl;
    }

    async uploadDocument(file: File, reqModel: UploadDocumentModel, config?: AxiosRequestConfig): Promise<UploadDocumentResponseModel> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('originalName', file.name);
        formData.append('fileSize', file.size.toString());
        formData.append('mimeType', file.type);
        formData.append('companyId', reqModel.companyId.toString());
        formData.append('userId', reqModel.userId.toString());
        if (reqModel.category) formData.append('category', reqModel.category);
        if (reqModel.description) formData.append('description', reqModel.description);
        if (reqModel.tags) formData.append('tags', reqModel.tags);

        return await this.axiosPostCall(this.getURLwithMainEndPoint('uploadDocument'), formData, config);
    }

    async deleteDocument(reqObj: DeleteDocumentModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteDocument'), reqObj, config);
    }

    async getDocument(reqObj: GetDocumentModel, config?: AxiosRequestConfig): Promise<GetDocumentResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getDocument'), reqObj, config);
    }

    async getAllDocuments(reqObj: GetAllDocumentsRequestModel, config?: AxiosRequestConfig): Promise<GetAllDocumentsResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllDocuments'), reqObj, config);
    }

    async downloadFile(id: number): Promise<Blob> {
        return await AxiosInstance.get(`${this.URL}${this.getURLwithMainEndPoint(`downloadDocument/${id}`)}`, {
            responseType: 'blob'
        }).then((response: any) => response.data);
    }

    async downloadSecureDocument(reqObj: { id: number, password?: string }): Promise<Blob> {
        return await AxiosInstance.post(`${this.URL}${this.getURLwithMainEndPoint('download')}`, reqObj, { responseType: 'blob' }).then((response: any) => response.data);
    }

    getDownloadUrl(id: number): string {
        return `${this.URL}${this.getURLwithMainEndPoint(`downloadDocument/${id}`)}`;
    }
}
