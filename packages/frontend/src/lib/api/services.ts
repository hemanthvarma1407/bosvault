import { AuthUsersService, EmployeesService, AssetInfoService, AssetTabsService, TicketsService, LicensesService, ReportsService, DashboardService, DocumentsService, CompanyService, ProcurementService, DepartmentService, AssetTypeService, DeviceConfigService, VendorService, ApplicationService, SlackUserService, EmailService, LicenseMasterService, NotificationsService, ContractsService, CountryService } from '@bosvault/shared-services';

export const authService = new AuthUsersService();
export const employeeService = new EmployeesService();
export const assetService = new AssetInfoService();
export const assetTabsService = new AssetTabsService();
export const ticketService = new TicketsService();
export const departmentService = new DepartmentService();
export const assetTypeService = new AssetTypeService();
export const deviceConfigService = new DeviceConfigService();
export const vendorService = new VendorService();
export const applicationService = new ApplicationService();
export const licenseMasterService = new LicenseMasterService();
export const slackUserService = new SlackUserService();
export const dashboardService = new DashboardService();
export const licensesService = new LicensesService();
export const reportsService = new ReportsService();
export const documentsService = new DocumentsService();
export const companyService = new CompanyService();
export const emailService = new EmailService();
export const procurementService = new ProcurementService();
export const notificationsService = new NotificationsService();
export const contractsService = new ContractsService();
export const countryService = new CountryService();

export const services = {
    auth: authService,
    asset: assetService,
    assetTabs: assetTabsService,
    ticket: ticketService,
    department: departmentService,
    assetType: assetTypeService,
    brand: deviceConfigService,
    vendor: vendorService,
    application: applicationService,
    licenseMaster: licenseMasterService,
    slackUser: slackUserService,
    licenses: licensesService,
    reports: reportsService,
    documents: documentsService,
    company: companyService,
    email: emailService,
    procurement: procurementService,
    notifications: notificationsService,
    contracts: contractsService,
    country: countryService,
};
