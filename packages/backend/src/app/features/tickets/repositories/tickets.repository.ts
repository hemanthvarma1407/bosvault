import { DataSource, Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { TicketsEntity } from "../entities/tickets.entity";

@Injectable()
export class TicketsRepository extends Repository<TicketsEntity> {
    constructor(private dataSource: DataSource) {
        super(TicketsEntity, dataSource.createEntityManager());
    }

    async findLatestTicketByPrefix(prefix: string): Promise<TicketsEntity | null> {
        return await this.createQueryBuilder('ticket')
            .where('ticket.ticketCode LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('ticket.ticketCode', 'DESC')
            .getOne();
    }
}
