import { AxiosRequestConfig } from "axios";
import { CommonAxiosService } from "../common-axios-service";
import {
    CreateTicketModel,
    UpdateTicketModel,
    DeleteTicketModel,
    GetTicketModel,
    GetTicketByIdModel,
    GetAllTicketsModel,
    GlobalResponse,
    IdRequestModel,
    GetTicketStatisticsRequestModel,
    UpdateTicketStatusRequestModel,
    AssignTicketRequestModel,
    AddTicketResponseRequestModel
} from '@bosvault/shared-models';

export class TicketsService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string) {
        return '/tickets/' + childUrl;
    }

    async createTicket(reqObj: CreateTicketModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('createTicket'), reqObj, config);
    }

    async updateTicket(reqObj: UpdateTicketModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateTicket'), reqObj, config);
    }

    async getTicket(reqObj: GetTicketModel, config?: AxiosRequestConfig): Promise<GetTicketByIdModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getTicket'), reqObj, config);
    }

    async getAllTickets(reqObj: IdRequestModel, config?: AxiosRequestConfig): Promise<GetAllTicketsModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllTickets'), reqObj, config);
    }

    async deleteTicket(reqObj: DeleteTicketModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteTicket'), reqObj, config);
    }

    async getMyTickets(config?: AxiosRequestConfig): Promise<GetAllTicketsModel> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getMyTickets'), {}, config);
    }

    async getStatistics(reqObj: GetTicketStatisticsRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('statistics'), reqObj, config);
    }

    async updateStatus(reqObj: UpdateTicketStatusRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('status'), reqObj, config);
    }

    async assignTicket(reqObj: AssignTicketRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('assign'), reqObj, config);
    }

    async addResponse(reqObj: AddTicketResponseRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('addResponse'), reqObj, config);
    }

    async uploadAttachment(file: File, config?: AxiosRequestConfig): Promise<GlobalResponse> {
        const formData = new FormData();
        formData.append('file', file);
        return await this.axiosPostCall(this.getURLwithMainEndPoint('upload-attachment'), formData, {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'multipart/form-data',
            },
        });
    }
}
