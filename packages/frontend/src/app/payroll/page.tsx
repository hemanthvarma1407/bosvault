'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeService, departmentService, licensesService, emailService } from '@/lib/api/services';
import { cn } from '@/lib/utils';
import {
    Users, Mail, Phone, DollarSign, Calendar, Info, FileText,
    Laptop, ChevronDown, Search, Check
} from 'lucide-react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum, GetAllEmployeesRequestModel, IdRequestModel } from '@bosvault/shared-models';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatPhoneNumberWithCountryCode } from '@/lib/utils';

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
    managerName?: string;
    joiningDate?: string;
    emailCreatedDate?: string;
    lastWorkingDay?: string;
    emailDeletionDate?: string;
}

interface Department {
    id: number;
    name: string;
}

const PayrollInfoPage: React.FC = () => {
    const { user } = useAuth();
    const reduxCompanyId = useAppSelector((state) => state.company.selectedCompanyId);
    const isSuperAdmin = !!(user?.roles?.includes('super_admin') || user?.role === 'super_admin');

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [licenses, setLicenses] = useState<any[]>([]);
    const [emails, setEmails] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    // Custom Searchable Combobox State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchEmployees = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const req = new GetAllEmployeesRequestModel(0, true);
            const response = await employeeService.getAllEmployees(req);

            if (response.status) {
                const mappedEmployees: Employee[] = (response.data || []).map((item: any) => ({
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
                    managerName: item.managerName,
                    joiningDate: item.joiningDate,
                    emailCreatedDate: item.emailCreatedDate,
                    lastWorkingDay: item.lastWorkingDay,
                    emailDeletionDate: item.emailDeletionDate,
                }));
                setEmployees(mappedEmployees.sort((a, b) => a.firstName.localeCompare(b.firstName)));
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await departmentService.getAllDepartments();
            if (response.status) {
                setDepartments(response.departments || []);
            }
        } catch (err: any) {
            console.error(err);
        }
    }, []);

    const fetchLicensesAndEmails = useCallback(async () => {
        if (!user) return;
        try {
            const req = new IdRequestModel(0);
            
            const [licRes, emailRes] = await Promise.all([
                licensesService.getAllLicenses(req),
                emailService.getAllEmailInfo(req)
            ]);

            if ((licRes as any).status) setLicenses((licRes as any).data || []);
            if ((emailRes as any).status) setEmails((emailRes as any).data || []);
        } catch (err) {
            console.error('Failed to fetch licenses or emails:', err);
        }
    }, [user]);

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchLicensesAndEmails();
    }, [fetchEmployees, fetchDepartments, fetchLicensesAndEmails]);

    // Close summary dropdown when changing employee
    useEffect(() => {
        setIsSummaryOpen(false);
    }, [selectedEmployeeId]);

    const filteredEmployees = useMemo(() => {
        const compId = reduxCompanyId ? Number(reduxCompanyId) : 0;
        if (compId === 0) return employees;
        const matching = employees.filter(e => Number(e.companyId) === compId || !e.companyId);
        return matching.length > 0 ? matching : employees;
    }, [employees, reduxCompanyId]);

    const comboboxEmployees = useMemo(() => {
        if (!dropdownSearch.trim()) return filteredEmployees;
        const q = dropdownSearch.toLowerCase();
        return filteredEmployees.filter(e =>
            e.firstName?.toLowerCase().includes(q) ||
            e.lastName?.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q)
        );
    }, [filteredEmployees, dropdownSearch]);

    const selectedEmployee = useMemo(() => {
        if (!selectedEmployeeId) return null;
        return employees.find(e => String(e.id) === String(selectedEmployeeId)) || null;
    }, [selectedEmployeeId, employees]);

    // Auto select first employee if current selection invalid or empty
    useEffect(() => {
        if (filteredEmployees.length > 0) {
            const exists = filteredEmployees.some(e => String(e.id) === String(selectedEmployeeId));
            if (!exists) {
                setSelectedEmployeeId(String(filteredEmployees[0].id));
            }
        }
    }, [filteredEmployees, selectedEmployeeId]);

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

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateActiveMonths = (emp: any) => {
        if (!emp.joiningDate) return 0;
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
        return diffDays / 30.4375;
    };

    const calculateCosts = (emp: any) => {
        const months = calculateActiveMonths(emp);
        const baseMonthly = Number(emp.billingAmount || 0);

        // Calculate License Costs
        const empLicenses = licenses.filter(l => l.assignedEmployeeId === emp.id || String(l.assignedEmployeeId) === String(emp.id));
        const licenseMonthly = empLicenses.reduce((sum, l) => sum + Number(l.costPerSeat || 0), 0);

        const totalMonthly = baseMonthly + licenseMonthly;

        return {
            months,
            baseMonthly,
            licenseMonthly,
            totalMonthly,
            baseTotal: Math.round(months * baseMonthly),
            licenseTotal: Math.round(months * licenseMonthly),
            grandTotal: Math.round(months * totalMonthly),
            empLicenses
        };
    };

    const renderCalculationSummary = (emp: any, costs: any) => {
        if (!emp.joiningDate) return 'No data to calculate';
        
        let endLabel = 'today';
        if (emp.empStatus?.toLowerCase() === 'deactivated' && emp.lastWorkingDay) {
            endLabel = 'last working day';
        }

        return (
            <div className="space-y-3">
                <div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Total Duration:</span> {costs.months.toFixed(1)} months (to {endLabel})
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1">
                    <div className="flex justify-between">
                        <span>Base Payroll:</span>
                        <span>${costs.baseMonthly.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between">
                        <span>License Costs:</span>
                        <span>${costs.licenseMonthly.toLocaleString()}/mo</span>
                    </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>Total Monthly:</span>
                    <span>${costs.totalMonthly.toLocaleString()}/mo</span>
                </div>
            </div>
        );
    };

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.SUPER_ADMIN]}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 lg:p-8 space-y-8">
                
                <PageHeader
                    title="Payroll Info"
                    description="Select an employee to view their detailed payroll breakdown and software licenses"
                    icon={<DollarSign />}
                    gradient="from-emerald-600 to-emerald-700"
                >
                    <div className="w-64 sm:w-80 md:w-96 relative z-50" ref={dropdownRef}>
                        {isLoading ? (
                            <div className="animate-pulse h-9 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full h-9 px-3 bg-white/10 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between shadow-sm hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <span className="truncate pr-2">
                                        {selectedEmployee 
                                            ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.email})`
                                            : '-- Select Employee --'}
                                    </span>
                                    <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0", isDropdownOpen && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute right-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl z-50 overflow-hidden"
                                        >
                                            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 relative">
                                                <Search className="h-3.5 w-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search employee name or email..."
                                                    value={dropdownSearch}
                                                    onChange={(e) => setDropdownSearch(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                                                    autoFocus
                                                />
                                            </div>

                                            <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                                                {comboboxEmployees.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                                        No employees match "{dropdownSearch}"
                                                    </div>
                                                ) : (
                                                    comboboxEmployees.map((emp) => {
                                                        const isSelected = String(emp.id) === String(selectedEmployeeId);
                                                        return (
                                                            <button
                                                                key={emp.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedEmployeeId(String(emp.id));
                                                                    setIsDropdownOpen(false);
                                                                    setDropdownSearch('');
                                                                }}
                                                                className={cn(
                                                                    "w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors",
                                                                    isSelected 
                                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" 
                                                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                                                                )}
                                                            >
                                                                <div className="truncate mr-2">
                                                                    <p className="font-bold truncate">{emp.firstName} {emp.lastName}</p>
                                                                    <p className="text-[10px] text-slate-400 font-normal truncate">{emp.email}</p>
                                                                </div>
                                                                {isSelected && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </PageHeader>

                <div className="max-w-7xl mx-auto space-y-6">

                    <AnimatePresence mode="wait">
                        {selectedEmployee && (
                            <motion.div
                                key={selectedEmployee.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Header Employee Profile Card */}
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 bg-gradient-to-br from-slate-900 to-slate-900 shadow-md">
                                            {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {selectedEmployee.firstName} {selectedEmployee.lastName}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                    {getDepartmentName(selectedEmployee)}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedEmployee.empStatus?.toLowerCase() === 'active' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : selectedEmployee.empStatus?.toLowerCase() === 'inactive' ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/30' : 'text-rose-700 bg-rose-100 dark:bg-rose-900/30'}`}>
                                                    {selectedEmployee.empStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Quick Stats */}
                                    {(() => {
                                        const costs = calculateCosts(selectedEmployee);
                                        return (
                                            <div className="flex flex-wrap gap-4 w-full md:w-auto">
                                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Monthly Burn</p>
                                                    <p className="text-lg font-bold text-slate-900 dark:text-white">${costs.totalMonthly.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/mo</span></p>
                                                </div>
                                                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                                    <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Grand Total Paid</p>
                                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-300">${costs.grandTotal.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {(() => {
                                    const costs = calculateCosts(selectedEmployee);
                                    return (
                                        <>
                                            {/* KPI Metric Summary Cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {/* Base Payroll */}
                                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Salary</span>
                                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                                                            <DollarSign className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">${costs.baseMonthly.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/mo</span></p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Paid: <span className="font-semibold text-slate-700 dark:text-slate-300">${costs.baseTotal.toLocaleString()}</span></p>
                                                </div>

                                                {/* Licenses */}
                                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Software Licenses</span>
                                                        <div className="p-2 bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-900/20 text-slate-900 dark:text-white rounded-lg">
                                                            <Laptop className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">${costs.licenseMonthly.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/mo</span></p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{costs.empLicenses.length} Assigned ({costs.licenseTotal.toLocaleString()} total)</p>
                                                </div>

                                                {/* Grand Total */}
                                                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md space-y-2 relative overflow-hidden">
                                                    <div className="absolute top-3 right-3">
                                                        <button onClick={() => setIsSummaryOpen(!isSummaryOpen)} className="p-1 rounded-md hover:bg-white/20 text-white transition-colors focus:outline-none">
                                                            <Info className="h-5 w-5" />
                                                        </button>
                                                        <AnimatePresence>
                                                            {isSummaryOpen && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className="absolute right-0 mt-2 w-64 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-20 text-slate-900 dark:text-white"
                                                                >
                                                                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wide">Calculation Summary</p>
                                                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                                                        {renderCalculationSummary(selectedEmployee, costs)}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Grand Total Cost</span>
                                                    <p className="text-3xl font-black">${costs.grandTotal.toLocaleString()}</p>
                                                    <p className="text-xs text-emerald-100/80">Tenure: {costs.months.toFixed(1)} months</p>
                                                </div>
                                            </div>

                                            {/* Details Columns */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                                {/* Left Column: User Profile Info */}
                                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-slate-900 dark:text-white" />
                                                        User Information
                                                    </h5>
                                                    <div className="space-y-3 text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-900/20 rounded-lg">
                                                                <Mail className="h-4 w-4 text-slate-900 dark:text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Email</p>
                                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.email}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-900/20 rounded-lg">
                                                                <Phone className="h-4 w-4 text-slate-900 dark:text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Phone</p>
                                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatPhoneNumberWithCountryCode(selectedEmployee.phNumber) || '—'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-900/20 rounded-lg">
                                                                <Users className="h-4 w-4 text-slate-900 dark:text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Manager</p>
                                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmployee.managerName || '—'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-900/20 rounded-lg">
                                                                <Calendar className="h-4 w-4 text-slate-900 dark:text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Joining Date</p>
                                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedEmployee.joiningDate)}</p>
                                                            </div>
                                                        </div>

                                                        {selectedEmployee.empStatus?.toLowerCase() === 'deactivated' && (
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                                                    <Calendar className="h-4 w-4 text-rose-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Last Working Day</p>
                                                                    <p className="font-semibold text-rose-600 dark:text-rose-400">{formatDate(selectedEmployee.lastWorkingDay)}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {selectedEmployee.remarks && (
                                                            <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg shrink-0">
                                                                    <FileText className="h-4 w-4 text-amber-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Remarks</p>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{selectedEmployee.remarks}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Column: Software Licenses List */}
                                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                                                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Laptop className="h-4 w-4 text-slate-900 dark:text-white" />
                                                            Assigned Software Licenses
                                                        </h5>
                                                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-900/30 text-slate-900 dark:text-white dark:text-slate-300 rounded-full">
                                                            {costs.empLicenses.length}
                                                        </span>
                                                    </div>

                                                    {costs.empLicenses.length === 0 ? (
                                                        <div className="py-8 text-center text-slate-400 text-xs">
                                                            No software licenses assigned to this employee.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                                                            {costs.empLicenses.map((lic: any, idx: number) => (
                                                                <div key={lic.id || idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                                                                    <div>
                                                                        <p className="font-bold text-slate-800 dark:text-slate-200">
                                                                            {lic.application?.name || lic.name || `License #${lic.id}`}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400">
                                                                            {lic.role ? `Role: ${lic.role}` : lic.billingCycle || 'Monthly'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-bold text-slate-900 dark:text-white dark:text-slate-300">
                                                                            ${Number(lic.costPerSeat || 0).toLocaleString()}/mo
                                                                        </p>
                                                                        {lic.assignedDate && (
                                                                            <p className="text-[10px] text-slate-400">Assigned: {formatDate(lic.assignedDate)}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        )}

                        {!selectedEmployee && !isLoading && (
                            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Select an Employee</h3>
                                <p className="text-xs text-slate-500 max-w-sm">Choose an employee from the dropdown above to view their detailed payroll breakdown, software licenses, and email costs.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </RouteGuard>
    );
};

export default PayrollInfoPage;
