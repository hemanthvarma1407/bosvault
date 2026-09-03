'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeService, companyService, departmentService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import {
    Plus, Search, Building2, Users, LayoutGrid, List, Mail, Phone, Edit, DollarSign, Eye, Calendar, Trash2, Upload
} from 'lucide-react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum, CreateEmployeeModel, UpdateEmployeeModel, EmployeeStatusEnum, GetAllEmployeesRequestModel, DeleteEmployeeModel } from '@bosvault/shared-models';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatPhoneNumberWithCountryCode } from '@/lib/utils';
import { EmployeeBulkImportModal } from './bulk-import';

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phNumber?: string;
    companyId: number;
    departmentId: number;
    departmentName?: string;
    empStatus: string;
    billingAmount?: number;
    remarks?: string;
    managerId?: number | null;
    managerName?: string;
    joiningDate?: string;
    emailCreatedDate?: string;
    lastWorkingDay?: string;
    emailDeletionDate?: string;
    groupEmails?: string[];
    userRole?: string;
    createdAt?: string;
}

interface Company {
    id: number;
    companyName: string;
}

interface Department {
    id: number;
    name: string;
    isActive: boolean;
}

const EmployeesPage: React.FC = () => {
    const { user } = useAuth();
    const reduxCompanyId = useAppSelector((state) => state.company.selectedCompanyId);
    const isSuperAdmin = !!(user?.roles?.includes('super_admin') || user?.role === 'super_admin');

    // Stable refs so fetchEmployees callback doesn't need user/isSuperAdmin as deps
    const userRef = React.useRef(user);
    const isSuperAdminRef = React.useRef(isSuperAdmin);
    React.useEffect(() => { userRef.current = user; }, [user]);
    React.useEffect(() => { isSuperAdminRef.current = isSuperAdmin; }, [isSuperAdmin]);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('active');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyId: '',
        departmentId: '',
        accountStatus: EmployeeStatusEnum.ACTIVE as string,
        billingAmount: '',
        remarks: '',
        managerId: '',
        joiningDate: '',
        emailCreatedDate: '',
        lastWorkingDay: '',
        emailDeletionDate: '',
        groupEmails: [] as string[],
        userRole: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

    // Track the current fetch so stale responses are ignored
    const fetchCounterRef = React.useRef(0);

    const fetchEmployees = useCallback(async () => {
        const currentUser = userRef.current;
        if (!currentUser) return;

        // Increment so any previously in-flight fetch is treated as stale
        fetchCounterRef.current += 1;
        const myFetchId = fetchCounterRef.current;

        setIsLoading(true);
        try {
            const includeDeactivated = true;
            // Fetch all authorized employees — company filtering is handled in UI
            const req = new GetAllEmployeesRequestModel(0, includeDeactivated);
            const response = await employeeService.getAllEmployees(req);

            // Discard result if a newer fetch was triggered while we awaited
            if (myFetchId !== fetchCounterRef.current) return;

            if (response.status) {
                const data = response.data || [];
                const mappedEmployees: Employee[] = data.map((item: any) => ({
                    id: Number(item.id),
                    firstName: item.firstName,
                    lastName: item.lastName,
                    email: item.email,
                    phNumber: item.phNumber,
                    companyId: Number(item.companyId || 0),
                    departmentId: Number(item.departmentId || 0),
                    departmentName: item.departmentName,
                    empStatus: item.empStatus,
                    billingAmount: item.billingAmount,
                    remarks: item.remarks,
                    managerId: item.managerId ? Number(item.managerId) : null,
                    managerName: item.managerName,
                    joiningDate: item.joiningDate,
                    emailCreatedDate: item.emailCreatedDate,
                    lastWorkingDay: item.lastWorkingDay,
                    emailDeletionDate: item.emailDeletionDate,
                    groupEmails: item.groupEmails,
                    userRole: item.userRole,
                    createdAt: item.createdAt || new Date().toISOString()
                }));
                setEmployees(mappedEmployees);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error) {
            if (myFetchId === fetchCounterRef.current) {
                console.error('Failed to fetch employees:', error);
            }
        } finally {
            // Only clear loading for the latest fetch
            if (myFetchId === fetchCounterRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const fetchCompanies = useCallback(async () => {
        try {
            const response = await companyService.getAllCompanies();
            if (response.status && response.data) {
                setCompanies(response.data as Company[]);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await departmentService.getAllDepartments();
            if (response.status) {
                setDepartments(response.departments || []);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        fetchCompanies();
        fetchDepartments();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const companyId = Number(formData.companyId || reduxCompanyId || user?.companyId);
        if (!companyId) {
            AlertMessages.getErrorMessage('Please select a company');
            return;
        }
        if (!formData.departmentId) {
            AlertMessages.getErrorMessage('Please select a department');
            return;
        }

        const managerIdValue = formData.managerId ? Number(formData.managerId) : null;

        try {
            if (editingEmployee) {
                const model = new UpdateEmployeeModel(
                    editingEmployee.id,
                    user?.id || 0,
                    companyId,
                    formData.firstName,
                    formData.lastName,
                    formData.email,
                    Number(formData.departmentId),
                    formData.accountStatus as EmployeeStatusEnum,
                    formData.phone,
                    Number(formData.billingAmount),
                    formData.remarks,
                    undefined, undefined, undefined, undefined,
                    managerIdValue,
                    formData.joiningDate ? new Date(formData.joiningDate) : undefined,
                    formData.emailCreatedDate ? new Date(formData.emailCreatedDate) : undefined,
                    formData.lastWorkingDay ? new Date(formData.lastWorkingDay) : undefined,
                    formData.emailDeletionDate ? new Date(formData.emailDeletionDate) : undefined,
                    formData.groupEmails,
                    formData.userRole || undefined
                );
                const response = await employeeService.updateEmployee(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    fetchEmployees();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateEmployeeModel(
                    user?.id || 0,
                    companyId,
                    formData.firstName,
                    formData.lastName,
                    formData.email,
                    Number(formData.departmentId),
                    formData.accountStatus as EmployeeStatusEnum,
                    formData.phone,
                    Number(formData.billingAmount),
                    formData.remarks,
                    undefined, undefined, undefined, undefined,
                    managerIdValue,
                    formData.joiningDate ? new Date(formData.joiningDate) : undefined,
                    formData.emailCreatedDate ? new Date(formData.emailCreatedDate) : undefined,
                    formData.lastWorkingDay ? new Date(formData.lastWorkingDay) : undefined,
                    formData.emailDeletionDate ? new Date(formData.emailDeletionDate) : undefined,
                    formData.groupEmails,
                    formData.userRole || undefined
                );
                const response = await employeeService.createEmployee(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    fetchEmployees();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleEdit = (employee: any) => {
        setEditingEmployee(employee);
        setFormData({
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            email: employee.email || '',
            phone: employee.phNumber || '',
            companyId: String(employee.companyId || ''),
            departmentId: String(employee.departmentId || ''),
            accountStatus: employee.empStatus || EmployeeStatusEnum.ACTIVE,
            billingAmount: (employee.billingAmount !== undefined && employee.billingAmount !== null) ? String(employee.billingAmount) : '',
            remarks: employee.remarks || '',
            managerId: employee.managerId ? String(employee.managerId) : '',
            joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
            emailCreatedDate: employee.emailCreatedDate ? new Date(employee.emailCreatedDate).toISOString().split('T')[0] : '',
            lastWorkingDay: employee.lastWorkingDay ? new Date(employee.lastWorkingDay).toISOString().split('T')[0] : '',
            emailDeletionDate: employee.emailDeletionDate ? new Date(employee.emailDeletionDate).toISOString().split('T')[0] : '',
            groupEmails: employee.groupEmails || [],
            userRole: employee.userRole || ''
        });
        setIsModalOpen(true);
    };



    const handleAddEmployee = () => {
        setEditingEmployee(null);
        setFormData({
            firstName: '', lastName: '', email: '', phone: '',
            companyId: !isSuperAdmin ? String(user?.companyId || '') : '',
            departmentId: '',
            accountStatus: EmployeeStatusEnum.ACTIVE as string,
            billingAmount: '', remarks: '', managerId: '',
            joiningDate: '', emailCreatedDate: '', lastWorkingDay: '', emailDeletionDate: '',
            groupEmails: [] as string[], userRole: ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
        setFormData({
            firstName: '', lastName: '', email: '', phone: '', companyId: '', departmentId: '',
            accountStatus: EmployeeStatusEnum.ACTIVE, billingAmount: '', remarks: '', managerId: '',
            joiningDate: '', emailCreatedDate: '', lastWorkingDay: '', emailDeletionDate: '', groupEmails: [], userRole: ''
        });
    };

    const handleDeleteClick = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!employeeToDelete) return;
        try {
            setIsDeleting(true);
            const req = new DeleteEmployeeModel(employeeToDelete.id);
            const response = await employeeService.deleteEmployee(req);
            if (response.status) {
                AlertMessages.getSuccessMessage(response.message);
                setIsDeleteModalOpen(false);
                setEmployeeToDelete(null);
                fetchEmployees();
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to delete employee');
        } finally {
            setIsDeleting(false);
        }
    };

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateTotalPaid = (emp: any) => {
        if (!emp.joiningDate || !emp.billingAmount) return 0;
        const start = new Date(emp.joiningDate);
        if (isNaN(start.getTime())) return 0;

        let end = new Date();
        if (emp.empStatus?.toLowerCase() === 'deactivated' && emp.lastWorkingDay) {
            const lwd = new Date(emp.lastWorkingDay);
            if (!isNaN(lwd.getTime())) end = lwd;
        }

        if (start > end) return 0;

        const diffTime = end.getTime() - start.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const diffMonths = diffDays / 30.4375;

        return Math.round(diffMonths * Number(emp.billingAmount));
    };

    const getDepartmentName = (emp: any) => {
        if (emp.departmentId && departments.length > 0) {
            const dept = departments.find(d => d.id === Number(emp.departmentId));
            if (dept) return dept.name;
        }
        if (emp.departmentName && !emp.departmentName.startsWith('Dept ID:')) {
            return emp.departmentName;
        }
        return 'Unknown Dept';
    };

    const getDepartmentBg = (emp: any) => {
        const deptName = getDepartmentName(emp);
        if (!deptName || deptName === 'Unknown Dept') return 'from-slate-500 to-slate-600';

        // const deptLower = deptName.toLowerCase();
        // Simple keyword matching for colors
        // if (deptLower.includes('it') || deptLower.includes('tech') || deptLower.includes('dev')) return 'from-slate-900 to-slate-900';
        // if (deptLower.includes('hr') || deptLower.includes('human')) return 'from-pink-500 to-rose-500';
        // if (deptLower.includes('finance') || deptLower.includes('account')) return 'from-emerald-500 to-teal-600';
        // if (deptLower.includes('admin')) return 'from-orange-400 to-amber-500';
        // if (deptLower.includes('sale')) return 'from-violet-500 to-purple-600';
        // if (deptLower.includes('operation')) return 'from-cyan-500 to-slate-900';
        // if (deptLower.includes('market')) return 'from-fuchsia-500 to-pink-600';
        // if (deptLower.includes('support')) return 'from-amber-500 to-orange-600';

        return 'from-slate-500 to-slate-600';
    };

    const filteredEmployees = employees.filter(emp => {
        const targetCompanyId = reduxCompanyId ? Number(reduxCompanyId) : 0;
        const matchesCompany = targetCompanyId === 0 || emp.companyId === targetCompanyId;

        const searchLower = searchQuery.toLowerCase();
        const deptName = getDepartmentName(emp).toLowerCase();
        const matchesSearch = !!(
            (emp.firstName && emp.firstName.toLowerCase().includes(searchLower)) ||
            (emp.lastName && emp.lastName.toLowerCase().includes(searchLower)) ||
            (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
            deptName.includes(searchLower) ||
            (emp.managerName && emp.managerName.toLowerCase().includes(searchLower))
        );

        const empStatus = emp.empStatus?.toLowerCase() || 'active';
        const matchesStatus = (statusFilter === 'all' || empStatus === statusFilter);

        return matchesCompany && matchesSearch && matchesStatus;
    }).sort((a, b) => {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
    });

    const targetCompanyId = reduxCompanyId ? Number(reduxCompanyId) : 0;
    const companyFilteredEmployees = targetCompanyId === 0
        ? employees
        : employees.filter(e => e.companyId === targetCompanyId);

    const stats = {
        total: companyFilteredEmployees.length,
        active: companyFilteredEmployees.filter(e => e.empStatus?.toLowerCase() === 'active').length,
        inactive: companyFilteredEmployees.filter(e => e.empStatus?.toLowerCase() === 'inactive').length,
        deactivated: companyFilteredEmployees.filter(e => e.empStatus?.toLowerCase() === 'deactivated').length,
        totalBilling: companyFilteredEmployees.filter(e => e.empStatus?.toLowerCase() !== 'deactivated').reduce((sum, emp) => sum + Number(emp.billingAmount || 0), 0),
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]} >
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 lg:p-8 space-y-8">

                {/* Header */}
                <PageHeader
                    title="User Directory"
                    description="Manage Google Workspace accounts, email users, and organization members"
                    icon={<Users />}
                    gradient="from-slate-900 to-slate-900"
                    actions={[
                        {
                            label: 'Bulk Import',
                            onClick: () => setIsBulkImportModalOpen(true),
                            icon: <Upload className="h-3.5 w-3.5" />,
                            variant: 'outline'
                        },
                        {
                            label: 'Add User',
                            onClick: handleAddEmployee,
                            icon: <Plus className="h-3.5 w-3.5" />,
                            variant: 'primary'
                        }
                    ]}
                >
                    {/* Stats Pills */}
                    <div className="hidden md:flex items-center gap-1.5">
                        {[
                            { label: 'Total', value: stats.total, color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
                            { label: 'Active', value: stats.active, color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                            { label: 'Inactive', value: stats.inactive, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
                            { label: 'Deactivated', value: stats.deactivated, color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' },
                            { label: 'Total Billing', value: `$${stats.totalBilling.toLocaleString()}`, color: 'bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-900/30 text-indigo-700 dark:text-slate-300' },
                        ].map(s => (
                            <span key={s.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${s.color}`}>
                                <span className="text-[10px] font-medium opacity-70">{s.label}</span> {s.value}
                            </span>
                        ))}
                    </div>
                </PageHeader>

                {/* Slim Toolbar */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            className="w-full pl-8 pr-3 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-slate-700 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-8 pl-2.5 pr-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-slate-700 flex-1 sm:flex-none uppercase font-bold"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="deactivated">Deactivated</option>
                        </select>
                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-transparent" />
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700"
                        >
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full mb-3">
                                <Users className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-white">No employees found</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        <motion.div
                            key="grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
                        >
                            {filteredEmployees.map((emp) => {
                                const isInactive = emp.empStatus?.toLowerCase() === 'inactive';
                                const isDeactivated = emp.empStatus?.toLowerCase() === 'deactivated';
                                return (
                                    <motion.div
                                        key={emp.id}
                                        className={`group relative rounded-xl border transition-all duration-200 overflow-hidden hover:shadow-md ${isInactive
                                            ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100 hover:border-amber-200 dark:hover:border-amber-900/50'
                                            : isDeactivated
                                                ? 'bg-rose-50/30 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 opacity-70 hover:opacity-100 hover:border-rose-300'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700/60'
                                            }`}
                                    >

                                        {/* Top accent */}
                                        {/* <div className={`h-1 w-full bg-gradient-to-r ${getDepartmentBg(emp)}`} /> */}

                                        <div className="p-3">
                                            <div className="flex items-start gap-2.5 mb-2.5">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-br ${getDepartmentBg(emp)}`}>
                                                    {getInitials(emp.firstName, emp.lastName)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white text-xs leading-tight truncate">
                                                            {emp.firstName} {emp.lastName}
                                                        </h3>
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${emp.empStatus?.toLowerCase() === 'active' ? 'bg-emerald-500' : emp.empStatus?.toLowerCase() === 'inactive' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                                                    </div>
                                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate block mt-0.5">
                                                        {getDepartmentName(emp)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Mail className="h-2.5 w-2.5 shrink-0 opacity-60" />
                                                    <span className="truncate">{emp.email}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-2.5 w-2.5 shrink-0 opacity-60" />
                                                    <span>{formatPhoneNumberWithCountryCode(emp.phNumber)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white dark:text-slate-300">
                                                    <Users className="h-2.5 w-2.5 shrink-0 opacity-70" />
                                                    <span className="truncate">{emp.managerName || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                                    <DollarSign className="h-2.5 w-2.5 shrink-0 opacity-70" />
                                                    <span>${Number(emp.billingAmount || 0).toLocaleString()} /mo</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white dark:text-slate-300 font-bold">
                                                    <DollarSign className="h-2.5 w-2.5 shrink-0 opacity-70" />
                                                    <span>${calculateTotalPaid(emp).toLocaleString()} total</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-700/70 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${emp.empStatus?.toLowerCase() === 'active' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' : emp.empStatus?.toLowerCase() === 'inactive' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
                                                {emp.empStatus}
                                            </span>
                                            <div className="flex gap-1">
                                                <button onClick={() => { setSelectedEmployee(emp); setIsDetailModalOpen(true); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="View details">
                                                    <Eye className="h-3 w-3" />
                                                </button>
                                                <button onClick={() => handleEdit(emp)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:bg-indigo-900/30 rounded text-slate-400 hover:text-slate-900 dark:text-white transition-colors" title="Edit">
                                                    <Edit className="h-3 w-3" />
                                                </button>
                                                {emp.empStatus?.toLowerCase() === 'deactivated' && (
                                                    <button onClick={() => handleDeleteClick(emp)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                    <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Department</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Manager</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right hidden lg:table-cell">Billing</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right hidden lg:table-cell">Total Paid</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.id} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-gradient-to-br ${getDepartmentBg(emp)}`}>
                                                        {getInitials(emp.firstName, emp.lastName)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-800 dark:text-white text-xs leading-tight">{emp.firstName} {emp.lastName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 hidden md:table-cell">
                                                <div className="text-[10px] text-slate-500 space-y-0.5">
                                                    <div className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{emp.email}</div>
                                                    <div className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{formatPhoneNumberWithCountryCode(emp.phNumber) || '-'}</div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 hidden lg:table-cell">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                    {getDepartmentName(emp)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 hidden xl:table-cell">
                                                <span className="text-xs text-slate-600 dark:text-slate-300">{emp.managerName || '—'}</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${emp.empStatus?.toLowerCase() === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                    }`}>
                                                    <span className={`w-1 h-1 rounded-full ${emp.empStatus?.toLowerCase() === 'active' ? 'bg-emerald-500' : emp.empStatus?.toLowerCase() === 'inactive' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                                                    {emp.empStatus}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right hidden lg:table-cell">
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    ${Number(emp.billingAmount || 0).toLocaleString('en-US')}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right hidden lg:table-cell">
                                                <span className="text-xs font-semibold text-slate-900 dark:text-white dark:text-slate-300">
                                                    ${calculateTotalPaid(emp).toLocaleString('en-US')}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => { setSelectedEmployee(emp); setIsDetailModalOpen(true); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="View details">
                                                        <Eye className="h-3 w-3" />
                                                    </button>
                                                    <button onClick={() => handleEdit(emp)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:bg-indigo-900/30 rounded text-slate-400 hover:text-slate-900 dark:text-white transition-colors" title="Edit">
                                                        <Edit className="h-3 w-3" />
                                                    </button>
                                                    {emp.empStatus?.toLowerCase() === 'deactivated' && (
                                                        <button onClick={() => handleDeleteClick(emp)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modals */}
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEmployee ? 'Edit Employee Profile' : 'Add New Employee'} size="4xl">
                    <form key={editingEmployee ? `edit-${editingEmployee.id}` : 'add'} onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="h-14" required />
                            <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="h-14" required />
                        </div>
                        <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Organization"
                                value={String(formData.companyId || '')}
                                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                options={[{ value: '', label: 'Select Organization' }, ...companies.map(c => ({ value: String(c.id), label: c.companyName || 'Unknown Company' }))]}
                                required
                                disabled={!isSuperAdmin}
                            />
                            <PhoneInput
                                label="Phone Number"
                                value={formData.phone}
                                onChange={(val) => setFormData({ ...formData, phone: val })}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Department"
                                value={String(formData.departmentId || '')}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                options={[{ value: '', label: 'Select Department' }, ...(departments?.filter(d => d.isActive).map(d => ({ value: String(d.id), label: d.name })) || [])]}
                                required
                            />
                            <Select
                                label="Reporting Manager"
                                value={formData.managerId}
                                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                disabled={!formData.companyId}
                                options={[{ value: '', label: 'Select Reporting Manager' }, ...(Number(formData.companyId) ? employees.filter(emp => {
                                    if (editingEmployee && emp.id === editingEmployee.id) return false;
                                    return emp.companyId === Number(formData.companyId);
                                }).map(emp => ({ value: String(emp.id), label: `${emp.firstName} ${emp.lastName}` })) : [])]}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select
                                label="Account Status"
                                value={formData.accountStatus}
                                onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value })}
                                options={[
                                    { value: EmployeeStatusEnum.ACTIVE, label: 'Active' },
                                    { value: EmployeeStatusEnum.INACTIVE, label: 'Inactive' },
                                    { value: EmployeeStatusEnum.DEACTIVATED, label: 'Deactivated' }
                                ]}
                            />
                            <Input label="Billing Amount ($)" type="number" step="0.01" value={formData.billingAmount} onChange={(e) => setFormData({ ...formData, billingAmount: e.target.value })} />
                            <Select
                                label="User Role"
                                value={formData.userRole}
                                onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                                options={[
                                    { value: '', label: 'Select Role' },
                                    { value: UserRoleEnum.SUPER_ADMIN, label: 'Super Admin' },
                                    // { value: UserRoleEnum.ADMIN, label: 'Admin' },
                                    // { value: UserRoleEnum.SUPPORT_ADMIN, label: 'Support Admin' },
                                    { value: UserRoleEnum.MANAGER, label: 'Manager' },
                                    { value: UserRoleEnum.USER, label: 'User' },
                                    // { value: UserRoleEnum.VIEWER, label: 'Viewer' }
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Joining Date"
                                type="date"
                                value={formData.joiningDate}
                                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                            />
                            <Input
                                label="Email Created Date"
                                type="date"
                                value={formData.emailCreatedDate}
                                onChange={(e) => setFormData({ ...formData, emailCreatedDate: e.target.value })}
                            />
                        </div>

                        {formData.accountStatus === EmployeeStatusEnum.DEACTIVATED && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30"
                            >
                                <Input
                                    label="Last Working Day"
                                    type="date"
                                    value={formData.lastWorkingDay}
                                    onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Email Deletion Date"
                                    type="date"
                                    value={formData.emailDeletionDate}
                                    onChange={(e) => setFormData({ ...formData, emailDeletionDate: e.target.value })}
                                    required
                                />
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Additional Remarks</label>
                            <textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-700 transition-all outline-none text-sm resize-none"
                                placeholder="Any additional notes about the employee..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button variant="outline" onClick={handleCloseModal} type="button">Cancel</Button>
                            <Button variant="primary" type="submit" isLoading={isLoading}>
                                {editingEmployee ? 'Update Profile' : 'Add Employee'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => { setIsDetailModalOpen(false); setSelectedEmployee(null); }}
                    title="Employee Profile"
                    size="2xl"
                >
                    {selectedEmployee && (
                        <div className="space-y-6">
                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 bg-gradient-to-br ${getDepartmentBg(selectedEmployee)} shadow-md`}>
                                    {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                                </div>
                                <div className="text-center sm:text-left flex-1">
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                                    </h4>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            {getDepartmentName(selectedEmployee)}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${selectedEmployee.empStatus?.toLowerCase() === 'active' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' : selectedEmployee.empStatus?.toLowerCase() === 'inactive' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
                                            {selectedEmployee.empStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Contact Details */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</h5>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-slate-900 dark:text-white shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Email Address</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-slate-900 dark:text-white shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Phone Number</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatPhoneNumberWithCountryCode(selectedEmployee.phNumber) || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Organization Details */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization Details</h5>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-slate-900 dark:text-white shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Reporting Manager</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.managerName || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-slate-900 dark:text-white shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Monthly Billing</p>
                                                <p className="font-semibold text-emerald-600 dark:text-emerald-400">${Number(selectedEmployee.billingAmount || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-slate-900 dark:text-white shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Total Paid</p>
                                                <p className="font-semibold text-slate-900 dark:text-white dark:text-slate-300">${calculateTotalPaid(selectedEmployee).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lifecycle Dates */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle & Timeline</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-900 dark:text-white shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Joining Date</p>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedEmployee.joiningDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-900 dark:text-white shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Email Created Date</p>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedEmployee.emailCreatedDate)}</p>
                                        </div>
                                    </div>
                                    {selectedEmployee.empStatus?.toLowerCase() === 'deactivated' && (
                                        <>
                                            <div className="flex items-center gap-2 p-2 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                                <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
                                                <div>
                                                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight">Last Working Day</p>
                                                    <p className="font-semibold text-rose-700 dark:text-rose-400">{formatDate(selectedEmployee.lastWorkingDay)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 p-2 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                                <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
                                                <div>
                                                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight">Email Deletion Date</p>
                                                    <p className="font-semibold text-rose-700 dark:text-rose-400">{formatDate(selectedEmployee.emailDeletionDate)}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedEmployee.remarks && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Additional Remarks</label>
                                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                                        {selectedEmployee.remarks}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                                {selectedEmployee.empStatus?.toLowerCase() === 'deactivated' && (
                                    <Button variant="danger" onClick={() => { handleDeleteClick(selectedEmployee); setIsDetailModalOpen(false); }}>
                                        Delete Employee
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => { setIsDetailModalOpen(false); setSelectedEmployee(null); }}>
                                    Close
                                </Button>
                                <Button variant="primary" onClick={() => { handleEdit(selectedEmployee); setIsDetailModalOpen(false); }}>
                                    Edit Profile
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                <DeleteConfirmDialog
                    isOpen={isDeleteModalOpen}
                    onClose={() => { setIsDeleteModalOpen(false); setEmployeeToDelete(null); }}
                    onConfirm={handleDeleteConfirm}
                    itemName={employeeToDelete ? `${employeeToDelete.firstName} ${employeeToDelete.lastName}` : 'employee'}
                    isDeleting={isDeleting}
                />

                <EmployeeBulkImportModal
                    isOpen={isBulkImportModalOpen}
                    onClose={() => setIsBulkImportModalOpen(false)}
                    companyId={Number(reduxCompanyId) || 0}
                    onSuccess={fetchEmployees}
                />

            </div>
        </RouteGuard>
    );
};




export default EmployeesPage;
