import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { EmailInfoEntity } from './entities/email-info.entity';
import { CreateEmailInfoModel, UpdateEmailInfoModel, DeleteEmailInfoModel, GetEmailInfoModel, GetEmailInfoByIdModel, EmailInfoResponseModel, GetAllEmailInfoModel, EmailStatsResponseModel, EmailStatusEnum, RequestAccessModel, GlobalResponse, IdRequestModel, SendTicketCreatedEmailModel, SendPasswordResetEmailModel, SendAssetAssignedEmailModel, SendTicketStatusUpdateEmailModel, SendPOApprovalEmailModel } from '@bosvault/shared-models';
import { GenericTransactionManager } from '../../../database/typeorm-transactions';
import { ErrorResponse } from '@bosvault/backend-utils';
import { ConfigService } from '@nestjs/config';
import { EmailInfoRepository } from './repositories/email-info.repository';
import { AccessRequestRepository } from './repositories/access-request.repository';
import { AccessRequestEntity } from './entities/access-request.entity';

@Injectable()
export class EmailInfoService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailInfoService.name);
  constructor(
    private readonly emailInfoRepo: EmailInfoRepository,
    private readonly accessRequestRepo: AccessRequestRepository,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');

    if (!emailUser || !emailPass) {
      this.logger.warn('EMAIL_USER or EMAIL_PASS is missing in environment variables. Email sending will not work.');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  async createEmailInfo(reqModel: CreateEmailInfoModel): Promise<GlobalResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!reqModel.email) throw new ErrorResponse(400, "Email is required");
      const existingEmail = await this.emailInfoRepo.findOne({ where: { email: reqModel.email } });
      if (existingEmail) throw new ErrorResponse(400, "Email already exists");
      await transManager.startTransaction();
      const newEmailInfo = new EmailInfoEntity();
      newEmailInfo.companyId = reqModel.companyId;
      newEmailInfo.emailType = reqModel.emailType;
      newEmailInfo.department = reqModel.department;
      newEmailInfo.email = reqModel.email;
      newEmailInfo.employeeId = reqModel.employeeId;
      newEmailInfo.status = reqModel.status || EmailStatusEnum.ACTIVE;
      newEmailInfo.memberIds = reqModel.memberIds;
      newEmailInfo.name = reqModel.name;
      newEmailInfo.billing = reqModel.billing;
      newEmailInfo.createdDate = reqModel.createdDate;
      newEmailInfo.description = reqModel.description;

      await transManager.getRepository(EmailInfoEntity).save(newEmailInfo);
      await transManager.completeTransaction();
      return new GlobalResponse(true, 201, "Email info created successfully");
    } catch (error) {
      await transManager.releaseTransaction();
      throw error;
    }
  }

  async updateEmailInfo(data: UpdateEmailInfoModel): Promise<GlobalResponse> {
    try {
      const emailInfo = await this.emailInfoRepo.findOne({ where: { id: data.id } });
      if (!emailInfo) {
        return new GlobalResponse(false, 404, 'Email info record not found');
      }

      emailInfo.email = data.email;
      emailInfo.emailType = data.emailType;
      emailInfo.department = data.department;
      emailInfo.employeeId = data.employeeId;
      emailInfo.memberIds = data.memberIds;
      emailInfo.name = data.name;
      emailInfo.billing = data.billing;
      emailInfo.createdDate = data.createdDate;
      emailInfo.description = data.description;
      if (data.status) emailInfo.status = data.status;

      await this.emailInfoRepo.save(emailInfo);
      return new GlobalResponse(true, 200, 'Email info record updated successfully');
    } catch (err: any) {
      return new GlobalResponse(false, 500, err.message);
    }
  }

  async getEmailInfo(reqModel: GetEmailInfoModel): Promise<GetEmailInfoByIdModel> {
    const emailInfo = await this.emailInfoRepo.findOne({ where: { id: reqModel.id } });
    if (!emailInfo) throw new ErrorResponse(404, "Email info not found");
    const response = new EmailInfoResponseModel(
      emailInfo.id,
      emailInfo.companyId,
      emailInfo.emailType,
      emailInfo.department,
      emailInfo.email,
      emailInfo.employeeId,
      undefined,
      undefined,
      emailInfo.memberIds,
      emailInfo.name,
      emailInfo.billing,
      emailInfo.createdDate,
      emailInfo.description,
      emailInfo.status
    );
    return new GetEmailInfoByIdModel(true, 200, "Email info retrieved successfully", response);
  }

  async getAllEmailInfo(reqModel: IdRequestModel): Promise<GetAllEmailInfoModel> {
    const data = await this.emailInfoRepo.getEmailsWithEmployee(reqModel.id);
    const responses = data.map(result => new EmailInfoResponseModel(
      result.id,
      result.company_id,
      result.email_type,
      result.department,
      result.email,
      result.employee_id,
      result.employee_name,
      result.employee_status,
      typeof result.member_ids === 'string' ? result.member_ids.split(',').filter(Boolean) : result.member_ids,
      result.name,
      Number(result.billing),
      result.created_date,
      result.description,
      result.status
    ));
    return new GetAllEmailInfoModel(true, 200, "Email info retrieved successfully", responses);
  }

  async getEmailStats(reqModel: IdRequestModel): Promise<EmailStatsResponseModel> {
    const stats = await this.emailInfoRepo.getEmailStatsByCompany(reqModel.id);
    return new EmailStatsResponseModel(true, 200, "Email stats retrieved successfully", stats);
  }

  async deleteEmailInfo(reqModel: DeleteEmailInfoModel): Promise<GlobalResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      const existingEmailInfo = await this.emailInfoRepo.findOne({ where: { id: reqModel.id } });
      if (!existingEmailInfo) throw new ErrorResponse(404, "Email info not found");
      await transManager.startTransaction();
      await transManager.getRepository(EmailInfoEntity).delete(reqModel.id);
      await transManager.completeTransaction();
      return new GlobalResponse(true, 200, "Email info deleted successfully");
    } catch (error) {
      await transManager.releaseTransaction();
      throw error;
    }
  }

  async sendAccessRequestEmail(request: RequestAccessModel): Promise<boolean> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL') || this.configService.get<string>('EMAIL_USER');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const emailUser = this.configService.get<string>('EMAIL_USER');
    const mailOptions = {
      from: `"BOS Vault System" <${emailUser}>`,
      to: adminEmail,
      replyTo: request.email,
      subject: `[Priority: Action Required] New Access Request from ${request.name}`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
  <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="color: #4f46e5; margin: 0;">BOS Vault</h2>
  </div>
  
  <p>Hello <strong>Admin</strong>,</p>
  <p>A new access request has been submitted by <strong>${request.name}</strong> (${request.email}).</p>
  
  <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 11px; color: #64748b; text-transform: uppercase;">Applicant</td>
        <td style="font-size: 11px; color: #64748b; text-transform: uppercase;">Work Email</td>
      </tr>
      <tr>
        <td style="font-weight: bold; font-size: 14px;">${request.name}</td>
        <td style="font-weight: bold; font-size: 14px; color: #4f46e5;">${request.email}</td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${frontendUrl}/users-management" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      Review Access Request
    </a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">BOS Vault System • Automated notification • Do not reply</p>
</div>
            `,
    };

    try {
      this.logger.log(`Access request email info generated for ${request.email}`);

      // 1. Admin Notification
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Access request admin notification sent: ${info.messageId}`);

      // 2. Requester Acknowledgement
      const ackMailOptions = {
        from: `"BOS Vault Security" <${emailUser}>`,
        to: request.email,
        subject: `Acknowledgement: We've received your access request`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
  <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="color: #4f46e5; margin: 0;">BOS Vault</h2>
  </div>
  
  <p>Hello <strong>${request.name}</strong>,</p>
  <p>Thank you for your interest in <strong>BOS Vault</strong>. We've successfully received your request for access.</p>
  
  <p>Our administrative team is currently reviewing your application. You will receive a separate email once your access has been approved.</p>
  
  <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #dcfce7;">
    <p style="margin: 0; font-size: 13px; color: #166534;"><strong>Next Steps:</strong> No action is required from your side at this moment.</p>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">BOS Vault System • Automated acknowledgement • Do not reply</p>
</div>
        `,
      };

      await this.transporter.sendMail(ackMailOptions);
      this.logger.log(`Access request acknowledgement sent to ${request.email}`);

      return true;
    } catch (error) {
      this.logger.error('Failed to send access request email', error);
      return false;
    }
  }

  async sendTicketCreatedEmail(reqModel: SendTicketCreatedEmailModel): Promise<boolean> {
    const { ticket, recipientEmail, roleName } = reqModel;
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const priorityColor =
      ticket.priorityEnum === 'HIGH'
        ? '#ef4444'
        : ticket.priorityEnum === 'MEDIUM'
          ? '#f59e0b'
          : '#10b981';

    const emailUser = this.configService.get<string>('EMAIL_USER');

    const mailOptions = {
      from: `"BOS Vault Support" <${emailUser}>`,
      to: recipientEmail,
      subject: `[Ticket Received] ${ticket.ticketCode} - ${ticket.subject}`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
  <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="color: #4f46e5; margin: 0;">BOS Vault Support</h2>
  </div>
  
  <p>Hello <strong>${roleName}</strong>,</p>
  <p>Ticket <strong>${ticket.ticketCode}</strong> has been created successfully.</p>
  
  <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase;">Ticket Code</td>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase;">Priority</td>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase;">Status</td>
      </tr>
      <tr>
        <td style="font-weight: bold; font-size: 14px;">${ticket.ticketCode}</td>
        <td style="font-weight: bold; font-size: 14px; color: ${priorityColor};">${ticket.priorityEnum}</td>
        <td style="font-weight: bold; font-size: 14px; color: #3b82f6;">OPEN</td>
      </tr>
      <tr>
        <td colspan="3" style="padding-top: 15px;">
           <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Subject</div>
           <div style="font-weight: bold; font-size: 13px;">${ticket.subject}</div>
        </td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${frontendUrl}/support?ticketId=${encodeURIComponent(ticket.id)}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      View Ticket Progress
    </a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">BOS Vault System • Automated notification • Do not reply</p>
</div>
`,

    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Ticket creation email sent to ${recipientEmail}: ${info.messageId}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending ticket creation email to ${recipientEmail}`,
        error
      );
      return false;
    }
  }


  async sendTicketStatusUpdateEmail(reqModel: SendTicketStatusUpdateEmailModel): Promise<boolean> {
    const { ticket, recipientEmail, roleName, oldStatus, newStatus } = reqModel;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const priorityColor = ticket.priorityEnum === 'HIGH' ? '#ef4444' : ticket.priorityEnum === 'MEDIUM' ? '#f59e0b' : '#10b981';

    // Status colors
    const statusColors: any = {
      'OPEN': '#3b82f6',
      'IN_PROGRESS': '#f59e0b',
      'RESOLVED': '#10b981',
      'CLOSED': '#64748b'
    };
    const newStatusColor = statusColors[newStatus] || '#3b82f6';

    const emailUser = this.configService.get<string>('EMAIL_USER');
    const mailOptions = {
      from: `"BOS Vault Support" < ${emailUser}> `,
      to: recipientEmail,
      subject: `[Ticket Update] ${ticket.ticketCode} - Status Changed to ${newStatus} `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
  <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="color: #4f46e5; margin: 0;">BOS Vault Support</h2>
  </div>
  
  <p>Hello <strong>${roleName}</strong>,</p>
  <p>The status of ticket <strong>${ticket.ticketCode}</strong> has been updated.</p>
  
  <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="50%" style="font-size: 11px; color: #64748b; text-transform: uppercase;">Previous Status</td>
        <td width="50%" style="font-size: 11px; color: #64748b; text-transform: uppercase;">New Status</td>
      </tr>
      <tr>
        <td style="font-size: 14px; color: #64748b;">${oldStatus}</td>
        <td style="font-weight: bold; font-size: 14px; color: ${newStatusColor};">${newStatus}</td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${frontendUrl}/support?ticketId=${encodeURIComponent(ticket.id)}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      View Ticket Update
    </a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">BOS Vault System • Automated notification • Do not reply</p>
</div>
            `,

    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Ticket status update email sent to ${recipientEmail}: ${info.messageId} `);
      return true;
    } catch (error) {
      this.logger.error(`Error sending ticket status update email to ${recipientEmail} `, error);
      return false;
    }
  }

  async sendPasswordResetEmail(reqModel: SendPasswordResetEmailModel): Promise<boolean> {
    const { email, token } = reqModel;
    const resetLink = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/reset-password?token=${token}`;

    const emailUser = this.configService.get<string>('EMAIL_USER');
    const mailOptions = {
      from: `"BOS Vault Security" <${emailUser}>`,
      to: email,
      subject: `[Security] Password Reset Request`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
  <div style="border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="color: #ef4444; margin: 0;">BOS Vault Security</h2>
  </div>
  
  <p>Hello,</p>
  <p>We received a request to reset your BOS Vault password. If you initiated this, please use the button below to set a new password.</p>
  
  <div style="background: #fff5f5; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #feb2b2; text-align: center;">
    <p style="margin: 0; font-size: 13px; color: #c53030;"><strong>Security Warning:</strong> This link will expire in 60 minutes.</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetLink}" style="background: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      Reset My Password
    </a>
  </div>
  
  <p style="font-size: 12px; color: #718096; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">BOS Vault System • Automated notification • Do not reply</p>
</div>
            `,
    };

    try {
      const emailUser = this.configService.get<string>('EMAIL_USER');
      const emailPass = this.configService.get<string>('EMAIL_PASS');

      if (!emailUser || !emailPass) {
        this.logger.error('Cannot send password reset email: EMAIL_USER or EMAIL_PASS environment variables are missing.');
        return false;
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Reset email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending reset email to ${email}`, error);
      return false;
    }
  }

  async getAllAccessRequests(): Promise<AccessRequestEntity[]> {
    return await this.accessRequestRepo.find({ order: { createdAt: 'DESC' } });
  }
  async sendAssetAssignedEmail(reqModel: SendAssetAssignedEmailModel): Promise<boolean> {
    console.log('sendAssetAssignedEmail called with model:', reqModel);
    const { recipientEmail, recipientName, assetName, assignedBy, assignedDate, isReassignment, remarks, assignedToName, recipientRole, assetType, serialNumber, specification } = reqModel;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');

    if (!emailUser || !emailPass) {
      this.logger.error('Email credentials missing for asset assignment');
      return false;
    }

    const actionText = isReassignment ? 'Reassigned' : 'Assigned';
    const subjectPrefix = isReassignment ? '[Asset Reassignment]' : '[Asset Assignment]';

    let subjectLine = '';
    let messageLine = '';

    if (recipientRole === 'MANAGER') {
      subjectLine = `${subjectPrefix} ${assetName} has been ${actionText.toLowerCase()} to your team member, ${assignedToName}`;
      messageLine = `The following asset has been <strong>${actionText.toLowerCase()}</strong> to your team member, <strong>${assignedToName}</strong>.`;
    } else if (recipientRole === 'ADMIN') {
      subjectLine = `${subjectPrefix} ${assetName} has been ${actionText.toLowerCase()} to ${assignedToName}`;
      messageLine = `The following asset has been <strong>${actionText.toLowerCase()}</strong> to <strong>${assignedToName}</strong>.`;
    } else {
      subjectLine = `${subjectPrefix} ${assetName} has been ${actionText.toLowerCase()} to you`;
      messageLine = `The following asset has been <strong>${actionText.toLowerCase()}</strong> to you.`;
    }

    const mailOptions = {
      from: `"BOS Vault Assets" <${emailUser}>`,
      to: recipientEmail,
      subject: subjectLine,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
  <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="color: #4f46e5; margin: 0;">BOS Vault Assets</h2>
  </div>
  
  <p>Hello <strong>${recipientName}</strong>,</p>
  <p>${messageLine}</p>
  ${remarks ? `<div style="padding: 10px; border-left: 4px solid #e5e7eb; background: #f9fafb; margin: 15px 0; font-style: italic; font-size: 13px;">"${remarks}"</div>` : ''}
  
  <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
      <tr>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase; padding-bottom: 6px;">Asset Name</td>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase; padding-bottom: 6px;">Asset Type</td>
        <td width="34%" style="font-size: 11px; color: #64748b; text-transform: uppercase; padding-bottom: 6px;">Serial Number</td>
      </tr>
      <tr>
        <td width="33%" style="font-weight: bold; font-size: 14px; vertical-align: top; padding-right: 15px;">${assetName}</td>
        <td width="33%" style="font-weight: bold; font-size: 14px; vertical-align: top; padding-right: 15px;">${assetType}</td>
        <td width="34%" style="font-weight: bold; font-size: 14px; vertical-align: top;">${serialNumber}</td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase; padding-bottom: 6px;">Specification</td>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase; padding-bottom: 6px;">Assigned By</td>
        <td width="34%" style="font-size: 11px; color: #64748b; text-transform: uppercase; padding-bottom: 6px;">Date</td>
      </tr>
      <tr>
        <td width="33%" style="font-weight: bold; font-size: 14px; vertical-align: top; padding-right: 15px;">${specification}</td>
        <td width="33%" style="font-weight: bold; font-size: 14px; vertical-align: top; padding-right: 15px;">${assignedBy}</td>
        <td width="34%" style="font-weight: bold; font-size: 14px; vertical-align: top;">${new Date(assignedDate).toLocaleDateString()}</td>
      </tr>
    </table>
  </div>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">BOS Vault System • Automated notification • Do not reply</p>
</div>
            `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Asset assignment email sent to ${recipientEmail}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending asset assignment email to ${recipientEmail}`, error);
      if (error instanceof Error) {
        this.logger.error(`Error stack: ${error.stack}`);
      }
      return false;
    }
  }

  async sendPOApprovalEmail(reqModel: SendPOApprovalEmailModel): Promise<boolean> {
    const { recipientEmails, recipientNames, poNumber, requesterName, totalAmount, vendorName, poId } = reqModel;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const emailUser = this.configService.get<string>('EMAIL_USER');

    const toEmail = recipientEmails[0];
    const ccEmails = recipientEmails.length > 1 ? recipientEmails.slice(1).join(',') : undefined;
    const allApproverNames = recipientNames.join(', ');

    const mailOptions = {
      from: `"BOS Vault Procurement" <${emailUser}>`,
      to: toEmail,
      ...(ccEmails && { cc: ccEmails }),
      subject: `[Approval Required] New Purchase Order: ${poNumber}`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
  <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="color: #4f46e5; margin: 0;">BOS Vault Procurement</h2>
  </div>
  
  <p>Hello <strong>${allApproverNames}</strong>,</p>
  <p>A new purchase order <strong>${poNumber}</strong> has been submitted and requires your approval.</p>
  
  <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase;">PO Number</td>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase;">Amount</td>
        <td width="33%" style="font-size: 11px; color: #64748b; text-transform: uppercase;">Vendor</td>
      </tr>
      <tr>
        <td style="font-weight: bold; font-size: 14px;">${poNumber}</td>
        <td style="font-weight: bold; font-size: 14px; color: #1e293b;">$${totalAmount.toLocaleString()}</td>
        <td style="font-weight: bold; font-size: 14px;">${vendorName}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding-top: 15px;">
           <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Requester</div>
           <div style="font-weight: bold; font-size: 13px;">${requesterName}</div>
        </td>
      </tr>
    </table>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">BOS Vault System • Automated notification • Do not reply</p>
</div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`PO approval email sent for ${poNumber} to ${recipientEmails.join(',')}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending PO approval email for ${poNumber} to ${recipientEmails.join(',')}`, error);
      return false;
    }
  }

  async sendVaultOtpEmail(email: string, otp: string): Promise<boolean> {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const mailOptions = {
      from: `"BOS Vault Security" <${emailUser}>`,
      to: email,
      subject: `[Security] Your Vault Security Key OTP`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
  <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; text-align: center; margin-bottom: 25px;">
    <h2 style="color: #4f46e5; margin: 0;">BOS Vault Security</h2>
  </div>
  
  <p style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 10px; color: #111827;">Vault Security OTP</p>
  <p style="text-align: center; color: #4b5563; font-size: 14px;">Use the following code to reset your vault security key. This code expires in <strong>10 minutes</strong>.</p>
  
  <div style="background: #f3f4f6; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; border: 1px dashed #d1d5db;">
    <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: bold; color: #1f2937; letter-spacing: 12px;">${otp}</span>
  </div>
  
  <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px;">If you did not request this, please secure your account immediately.</p>
  
  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">BOS Vault System • Automated notification • Do not reply</p>
</div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Vault OTP email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending vault OTP email to ${email}`, error);
      return false;
    }
  }
}
