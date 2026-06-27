'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { companyService, emailService, departmentService, employeeService } from '@/lib/api/services';
import { PageHeader } from '@/components/ui/PageHeader';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { EmailInfoResponseModel, EmailTypeEnum, IdRequestModel, UserRoleEnum, DepartmentEnum, DeleteEmailInfoModel, GetAllEmployeesRequestModel, EmailStatusEnum } from '@bosvault/shared-models';
import {
    Mail, Building2, Plus, Trash2, Search,
    Headphones, ShieldCheck, Landmark, Settings, Pencil,
    TrendingUp, Megaphone, Users2,
    User, Users, Globe, ChevronDown, ChevronRight
} from 'lucide-react';
import { AddEmailModal } from './AddEmailModal';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';


// Category Definitions
type EmailCategory = 'COMPANY' | 'USER' | 'GROUP';

const CategoryConfig: Record<EmailCategory, { label: string, icon: any, color: string, types: EmailTypeEnum[] }> = {
    COMPANY: {
        label: 'Company Emails',
        icon: Globe,
        color: 'indigo',
        types: [EmailTypeEnum.COMPANY]
    },
    USER: {
        label: 'Employee Emails',
        icon: User,
        color: 'emerald',
        types: [EmailTypeEnum.USER]
    },
    GROUP: {
        label: 'Group Emails',
        icon: Users,
        color: 'amber',
        types: [EmailTypeEnum.GROUP]
    },
};

// Department Visual Configuration
const DeptConfig: Record<string, { icon: any, color: string, bg: string, border: string, label: string }> = {
    [DepartmentEnum.IT]: { icon: Settings, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-100 dark:border-indigo-900/30', label: 'IT & Infrastructure' },
    [DepartmentEnum.HR]: { icon: Users2, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', border: 'border-fuchsia-100 dark:border-fuchsia-900/30', label: 'Human Resources' },
    [DepartmentEnum.FINANCE]: { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-100 dark:border-emerald-900/30', label: 'Accounts & Finance' },
    [DepartmentEnum.SUPPORT]: { icon: Headphones, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-100 dark:border-rose-900/30', label: 'Customer Support' },
    [DepartmentEnum.MARKETING]: { icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-100 dark:border-amber-900/30', label: 'Marketing & Sales' },
    [DepartmentEnum.SALES]: { icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-100 dark:border-violet-900/30', label: 'Sales & Partnerships' },
    [DepartmentEnum.OPERATIONS]: { icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-100 dark:border-cyan-900/30', label: 'Operations & Logistics' },
    'Unassigned': { icon: Globe, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950/40', border: 'border-slate-100 dark:border-slate-900/30', label: 'General' },
    'Default': { icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-100 dark:border-indigo-900/30', label: 'Department' },
};

const EmailRow: React.FC<{
    acc: EmailInfoResponseModel;
    idx: number;
    employees: any[];
    activeTab: EmailCategory;
    onToggleStatus: (data: EmailInfoResponseModel) => void;
    onEdit: (data: EmailInfoResponseModel) => void;
    onDelete: (id: number) => void;
}> = ({ acc, idx, employees, activeTab, onToggleStatus, onEdit, onDelete }) => {
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const memberNames = useMemo(() => {
        if (!acc.memberIds) return [];
        return acc.memberIds.map(id => {
            const emp = employees.find(e => String(e.id) === String(id));
            return emp ? `${emp.firstName} ${emp.lastName}` : `Unknown (${id})`;
        });
    }, [acc.memberIds, employees]);

    const isGroup = acc.emailType === EmailTypeEnum.GROUP;
    const isCompany = acc.emailType === EmailTypeEnum.COMPANY;

    return (
        <>
            <tr className={`group/row border-b last:border-0 border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-indigo-500/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/[0.01]'}`}>
                <td className="p-4 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-center gap-2">
                        {(isCompany || isGroup) && acc.name && (
                            <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight truncate max-w-[120px]">
                                {acc.name}
                            </span>
                        )}
                        {!isCompany && !isGroup && acc.employeeName && (
                            <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight truncate max-w-[100px]">
                                {acc.employeeName}
                            </span>
                        )}
                    </div>
                </td>
                <td className="p-4 border border-slate-200 dark:border-white/10 text-center">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 transition-colors uppercase tracking-tight">
                            {acc.email}
                        </span>
                        {isGroup && memberNames.length > 0 && (
                            <button
                                onClick={() => setIsMembersOpen(!isMembersOpen)}
                                className="flex items-center justify-center gap-1 mt-1 text-[9px] font-bold text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors"
                            >
                                {isMembersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                {memberNames.length} Members
                            </button>
                        )}
                    </div>
                </td>
                <td className="p-4 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-center w-full">
                        <button
                            onClick={() => onToggleStatus(acc)}
                            className={`px-3 py-1 flex items-center justify-center text-[10px] font-black tracking-widest rounded-lg border transition-all shadow-sm ${acc.status === EmailStatusEnum.ACTIVE
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-900/50'
                                : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:border-rose-300 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30 dark:hover:bg-rose-900/50'
                                }`}
                            title="Click to toggle status"
                        >
                            {acc.status === EmailStatusEnum.ACTIVE ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                    </div>
                </td>
                <td className="p-4 border border-slate-200 dark:border-white/10">
                    <div className="flex justify-center gap-1">
                        <button
                            onClick={() => onEdit(acc)}
                            title="Edit Email"
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => onDelete(acc.id)}
                            title="Delete Email"
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {isCompany && (
                            <div className="flex items-center justify-center w-full ml-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    ${Number(acc.billing || 0).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
            <AnimatePresence>
                {isMembersOpen && (
                    <tr>
                        <td colSpan={4} className="p-0 border-0">
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-slate-50/50 dark:bg-white/[0.01]"
                            >
                                <div className="p-4 pl-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {memberNames.map((name, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/5">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                {name.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight truncate">
                                                {name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </td>
                    </tr>
                )}
            </AnimatePresence>
        </>
    );
};

const InfoEmailsPage: React.FC = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [emailInfoList, setEmailInfoList] = useState<EmailInfoResponseModel[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [activeTab, setActiveTab] = useState<EmailCategory>('USER');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState<EmailInfoResponseModel | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    const fetchEmployeesForLookup = useCallback(async () => {
        try {
            const req = new GetAllEmployeesRequestModel(Number(selectedOrg) || 0);
            const response = await employeeService.getAllEmployees(req);
            if (response.status) {
                setEmployees(response.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch employees for lookup:', err);
        }
    }, [selectedOrg]);

    const fetchCompanies = useCallback(async () => {
        try {
            const response = await companyService.getAllCompanies();
            if (response.status && response.data) {
                setCompanies(response.data as any[]);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to fetch companies');
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await departmentService.getAllDepartments();
            if (response.status) {
                setDepartments(response.departments || []);
            }
        } catch (err: any) {
            console.error('Failed to fetch departments:', err);
        }
    }, []);

    const fetchEmailInfo = useCallback(async () => {
        try {
            const req = new IdRequestModel(Number(selectedOrg) || 0);
            const response = await emailService.getAllEmailInfo(req);
            if (response.status) {
                setEmailInfoList(response.data || []);
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to fetch email info');
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'An error occurred while fetching email info');
        }
    }, [selectedOrg]);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    useEffect(() => {
        fetchEmailInfo();
        fetchDepartments();
        fetchEmployeesForLookup();
    }, [selectedOrg, fetchEmailInfo, fetchDepartments, fetchEmployeesForLookup]);


    const handleUpsertEmailInfo = async (data: any) => {
        try {
            const response = data.id
                ? await emailService.updateEmailInfo(data)
                : await emailService.createEmailInfo(data);
            if (response.status) {
                AlertMessages.getSuccessMessage(response.message || `Email info record ${data.id ? 'updated' : 'created'} successfully`);
                await fetchEmailInfo();
                setEditData(null);
                return true;
            } else {
                AlertMessages.getErrorMessage(response.message || `Failed to ${data.id ? 'update' : 'create'} email info`);
                return false;
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || `Failed to ${data.id ? 'update' : 'create'} email info`);
            return false;
        }
    };

    const handleToggleStatus = async (data: EmailInfoResponseModel) => {
        const newStatus = data.status === 'active' ? 'inactive' : 'active';
        const payload = {
            ...data,
            status: newStatus
        };
        await handleUpsertEmailInfo(payload);
    };

    const handleEdit = (data: EmailInfoResponseModel) => {
        setEditData(data);
        setIsModalOpen(true);
    };

    const handleDeleteEmailInfo = (id: number) => {
        const item = emailInfoList.find(e => e.id === id);
        if (item) {
            setItemToDelete(item);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const response = await emailService.deleteEmailInfo({ id: itemToDelete.id } as DeleteEmailInfoModel);
            if (response.status) {
                AlertMessages.getSuccessMessage(response.message || 'Email info record removed');
                await fetchEmailInfo();
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to delete record');
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to delete record');
        }
    };

    const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

    const toggleDept = (dept: string) => {
        setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
    };


    const categoryEmails = useMemo(() => {
        const categoryTypes = CategoryConfig[activeTab].types;
        return emailInfoList.filter(acc => categoryTypes.includes(acc.emailType));
    }, [emailInfoList, activeTab]);

    const filteredEmails = useMemo(() => {
        return categoryEmails.filter(acc =>
            acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (acc.department?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
    }, [categoryEmails, searchQuery]);

    const groupedData = useMemo(() => {
        const groups: Record<string, typeof emailInfoList> = {};

        // If not employee emails, return a single flat group
        if (activeTab !== 'USER') {
            const label = CategoryConfig[activeTab].label;
            groups[label] = filteredEmails;
            return groups;
        }

        filteredEmails.forEach(email => {
            const company = companies.find(c => c.id === email.companyId);
            const companyName = company ? (company.companyName || company.name) : 'Unknown';
            const deptName = email.department || 'Unassigned';

            // Create a unique key that includes company name if in "All Companies" view
            const groupKey = selectedOrg === '' ? `${companyName} | ${deptName}` : deptName;

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(email);
        });

        // If not searching, ensure all departments from the selected company (or all) are shown
        if (searchQuery === '') {
            if (selectedOrg === '') {
                companies.forEach(company => {
                    const companyName = company.companyName || company.name;
                    departments.forEach(dept => {
                        const groupKey = `${companyName} | ${dept.name}`;
                        if (!groups[groupKey]) groups[groupKey] = [];
                    });
                });
            } else {
                departments.forEach(dept => {
                    if (!groups[dept.name]) groups[dept.name] = [];
                });
            }
        }

        return groups;
    }, [filteredEmails, departments, searchQuery, activeTab, selectedOrg, companies]);

    // Auto-expand all groups whenever the tab or grouped data changes
    useEffect(() => {
        const newExpanded: Record<string, boolean> = {};
        Object.keys(groupedData).forEach(key => {
            newExpanded[key] = true;
        });
        setExpandedDepts(newExpanded);
    }, [groupedData]);

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-950/40 space-y-8 pb-32">
                {/* Header Section */}
                <PageHeader
                    icon={<Mail className="h-4 w-4" />}
                    title="Email Management"
                    description="Manage company and employee email addresses"
                    gradient="from-indigo-600 via-indigo-700 to-violet-800"
                    actions={[
                        {
                            label: 'Add Email',
                            onClick: () => setIsModalOpen(true),
                            icon: <Plus className="w-3.5 h-3.5" />,
                            variant: 'primary'
                        }
                    ]}
                >
                    <div className="flex flex-col lg:flex-row items-center gap-4 w-full justify-end">
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 h-8 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-[11px] outline-none"
                                />
                            </div>

                            <div className="relative w-full sm:w-48 group">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500 group-focus-within:scale-110 transition-transform" />
                                <select
                                    value={selectedOrg}
                                    onChange={(e) => setSelectedOrg(e.target.value)}
                                    className="w-full pl-9 pr-8 h-8 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-[10px] appearance-none outline-none cursor-pointer uppercase tracking-widest"
                                >
                                    <option value="" className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">All Companies</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">{c.companyName || c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </PageHeader>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Concepts */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-1">
                            {(Object.keys(CategoryConfig) as EmailCategory[]).map((cat) => {
                                const config = CategoryConfig[cat];
                                const Icon = config.icon;
                                const isActive = activeTab === cat;

                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveTab(cat)}
                                        className={`
                                            w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group
                                            ${isActive
                                                ? `bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1`
                                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'} transition-colors`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[11px] font-black uppercase tracking-tight">{config.label}</div>
                                                <div className={`text-[9px] font-medium opacity-70 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                    {cat === 'COMPANY' ? 'Company' : cat === 'USER' ? 'Employees' : 'Groups'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Active Records</div>
                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{filteredEmails.length}</div>
                        </div>

                        {activeTab === 'COMPANY' && (
                            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm mt-3">
                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Total Billing</div>
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    ${filteredEmails.reduce((sum, email) => sum + (Number(email.billing) || 0), 0).toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collapsible Panel List */}
                    <div className="lg:col-span-3 space-y-3">
                        {Object.entries(groupedData).map(([dept, emails]) => {
                                const config = DeptConfig[dept] || DeptConfig['Default'];
                                const Icon = config.icon;
                                const isExpanded = !!expandedDepts[dept];

                                if (emails.length === 0 && searchQuery !== '') return null;

                                return (
                                    <div key={dept} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
                                        <button
                                            onClick={() => toggleDept(dept)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-9 h-9 rounded-xl ${config.bg} ${config.color} border ${config.border} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white leading-none">{dept}</h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/10">
                                                    {emails.length} Records
                                                </div>
                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-slate-50 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                                                {emails.length === 0 ? (
                                                    <div className="p-8 text-center text-slate-400 opacity-50">
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No records found for this department</p>
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-center border-collapse border border-slate-200 dark:border-white/10">
                                                            <thead>
                                                                <tr className="bg-slate-50/50 dark:bg-white/[0.01]">
                                                                    <th className="p-4 text-[9px] font-black text-center text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10">Full Name</th>
                                                                    <th className="p-4 text-[9px] font-black text-center text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10">Email Address</th>
                                                                    <th className="p-4 text-[9px] font-black text-center text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10">Status</th>
                                                                    <th className="p-4 text-[9px] font-black text-center text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {emails.map((acc, idx) => (
                                                                    <EmailRow
                                                                        key={acc.id}
                                                                        acc={acc}
                                                                        idx={idx}
                                                                        employees={employees}
                                                                        activeTab={activeTab}
                                                                        onToggleStatus={handleToggleStatus}
                                                                        onEdit={handleEdit}
                                                                        onDelete={handleDeleteEmailInfo}
                                                                    />
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                <AddEmailModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditData(null);
                    }}
                    companyId={Number(selectedOrg) || 0}
                    onSuccess={handleUpsertEmailInfo}
                    initialTab={activeTab}
                    editData={editData}
                    companies={companies}
                />
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete Email"
                    itemName={itemToDelete ? itemToDelete.email : undefined}
                />
            </div>
        </RouteGuard>
    );
}

export default InfoEmailsPage;
