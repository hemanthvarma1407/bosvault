import { Column, Entity, Index } from 'typeorm';
import { CommonBaseEntity } from '../../../../database/common-base.entity';
import { TicketCategoryEnum, TicketPriorityEnum, TicketStatusEnum, TicketSeverityEnum } from '@bosvault/shared-models';

@Entity('tickets')
export class TicketsEntity extends CommonBaseEntity {
    @Column('varchar', { name: 'ticket_code', length: 50, nullable: false, unique: true, comment: 'Unique ticket code' })
    ticketCode: string;

    @Column('bigint', { name: 'employee_id', nullable: false, comment: 'Reference to employees table' })
    employeeId: number;

    @Column('bigint', { name: 'assign_admin_id', nullable: true, comment: 'Reference to it_admin table' })
    assignAdminId: number;

    @Column('enum', { name: 'category_enum', enum: TicketCategoryEnum, nullable: false, comment: 'Ticket category' })
    categoryEnum: TicketCategoryEnum;

    @Column('enum', { name: 'priority_enum', enum: TicketPriorityEnum, nullable: false, comment: 'Ticket priority level' })
    priorityEnum: TicketPriorityEnum;

    @Column('text', { name: 'subject', nullable: false, comment: 'Ticket subject' })
    subject: string;

    @Column('text', { name: 'description', nullable: true, comment: 'Detailed ticket description' })
    description: string;

    @Column('text', { name: 'response', nullable: true, comment: 'Admin response summary' })
    response: string;

    @Column('enum', { name: 'ticket_status', enum: TicketStatusEnum, default: TicketStatusEnum.OPEN, nullable: false, comment: 'Current ticket status' })
    ticketStatus: TicketStatusEnum;

    @Column('timestamp', { name: 'resolved_at', nullable: true, comment: 'Timestamp when ticket was resolved' })
    resolvedAt: Date;

    @Column('timestamp', { name: 'sla_deadline', nullable: true, comment: 'SLA deadline timestamp' })
    slaDeadline: Date;

    @Column('int', { name: 'time_spent_minutes', default: 0, comment: 'Total time spent by technicians in minutes' })
    timeSpentMinutes: number;

    @Column('timestamp', { name: 'expected_completion_date', nullable: true, comment: 'Expected completion date' })
    expectedCompletionDate: Date;

    @Column('varchar', { name: 'sub_category', nullable: true, length: 100, comment: 'Ticket sub-category' })
    subCategory: string;

    @Column('enum', { name: 'severity_enum', enum: TicketSeverityEnum, nullable: true, comment: 'Ticket severity level' })
    severityEnum: TicketSeverityEnum;

    @Column('varchar', { name: 'department', nullable: true, length: 100, comment: 'User department' })
    department: string;

    @Column('varchar', { name: 'contact_number', nullable: true, length: 50, comment: 'User contact number' })
    contactNumber: string;

    @Column('varchar', { name: 'location', nullable: true, length: 100, comment: 'User location' })
    location: string;

    @Column('varchar', { name: 'contact_email', nullable: true, length: 100, comment: 'User contact email' })
    contactEmail: string;

    @Column('varchar', { name: 'assigned_group', nullable: true, length: 100, comment: 'Assigned group/team' })
    assignedGroup: string;

    @Column('varchar', { name: 'sla_type', nullable: true, length: 50, comment: 'SLA type' })
    slaType: string;

    @Column('timestamp', { name: 'response_due_time', nullable: true, comment: 'Response due time' })
    responseDueTime: Date;

    @Column('int', { name: 'escalation_level', default: 0, comment: 'Escalation level' })
    escalationLevel: number;

    @Column('text', { name: 'admin_comments', nullable: true, comment: 'Admin comments' })
    adminComments: string;

    @Column('text', { name: 'user_comments', nullable: true, comment: 'User comments' })
    userComments: string;

    @Column('text', { name: 'internal_notes', nullable: true, comment: 'Internal notes (admin only)' })
    internalNotes: string;

    @Column('text', { name: 'root_cause', nullable: true, comment: 'Root cause analysis' })
    rootCause: string;

    @Column('text', { name: 'resolution_summary', nullable: true, comment: 'Resolution summary' })
    resolutionSummary: string;

    @Column('bigint', { name: 'resolved_by', nullable: true, comment: 'ID of admin who resolved the ticket' })
    resolvedBy: number;

    @Column('text', { name: 'closure_remarks', nullable: true, comment: 'Closure remarks' })
    closureRemarks: string;

    @Column('int', { name: 'user_rating', nullable: true, comment: 'User rating (1-5)' })
    userRating: number;

    @Column('text', { name: 'user_feedback', nullable: true, comment: 'User feedback text' })
    userFeedback: string;
}
