import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import { CreateArticleRequestModel, UpdateArticleRequestModel, SearchArticleRequestModel, GlobalResponse, GetKnowledgeBaseStatsResponseModel, GetKnowledgeArticleResponseModel, IdRequestModel } from '@bosvault/shared-models';

export class KnowledgeBaseService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/knowledge-base/' + childUrl;
    }

    async createArticle(reqObj: CreateArticleRequestModel, file?: File, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            Object.keys(reqObj).forEach(key => {
                const value = (reqObj as any)[key];
                if (Array.isArray(value)) {
                    value.forEach(v => formData.append(key, v));
                } else if (value !== undefined) {
                    formData.append(key, value.toString());
                }
            });
            return await this.axiosPostCall(this.getURLwithMainEndPoint('createArticle'), formData, config);
        }
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createArticle'), reqObj, config);
    }

    async updateArticle(reqObj: UpdateArticleRequestModel, file?: File, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            Object.keys(reqObj).forEach(key => {
                const value = (reqObj as any)[key];
                if (Array.isArray(value)) {
                    value.forEach(v => formData.append(key, v));
                } else if (value !== undefined) {
                    formData.append(key, value.toString());
                }
            });
            return await this.axiosPostCall(this.getURLwithMainEndPoint('updateArticle'), formData, config);
        }
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateArticle'), reqObj, config);
    }

    getAttachmentUrl(fileName: string): string {
        return `${this.URL}${this.getURLwithMainEndPoint(`download/${fileName}`)}`;
    }

    async deleteArticle(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteArticle'), reqObj, config);
    }

    async getArticle(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetKnowledgeArticleResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getArticle'), reqObj, config);
    }

    async searchArticles(reqObj: SearchArticleRequestModel, config?: AxiosRequestConfig): Promise<any[]> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('searchArticles'), reqObj, config);
    }

    async getStats(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetKnowledgeBaseStatsResponseModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getStats'), reqObj, config);
    }
}
