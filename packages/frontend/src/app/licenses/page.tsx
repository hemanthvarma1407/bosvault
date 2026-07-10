'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { companyService, employeeService, applicationService, licensesService } from '@/lib/api/services';
import { UserRoleEnum, CreateLicenseModel, UpdateLicenseModel, DeleteLicenseModel, IdRequestModel } from '@bosvault/shared-models';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    Plus, Key, Trash2, Shield, Pencil, Search,
    Building2, Clock,
    ChevronDown, ChevronRight
} from 'lucide-react';


import { RouteGuard } from '@/components/auth/RouteGuard';
import { AddLicenseModal } from './AddLicenseModal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { Select } from '@/components/ui/Select';





interface License {
    id: number;
    companyId: number;
    applicationId: number;
    expiryDate?: string;
    purchaseDate?: string;
    assignedDate?: string;
    remarks?: string;
    licenseKey?: string;
    seats?: number;
    totalSeats?: number;
    costPerSeat?: number;
    billingCycle?: string;
    company?: {
        id: number;
        companyName: string;
    };
    application?: {
        id: number;
        name: string;
        logo?: string;
    };
    assignedEmployeeId?: number;
    assignedEmployee?: {
        id: number;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    role?: string;
    createdAt: string;
}

interface Company {
    id: number;
    companyName: string;
}

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
}

interface Application {
    id: number;
    name: string;
}

export default function LicensesPage() {
    const { user } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [licenses, setLicenses] = useState<License[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('0');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editLicense, setEditLicense] = useState<License | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});


    const toggleApp = (appName: string) => {
        setExpandedApps(prev => ({ ...prev, [appName]: !prev[appName] }));
    };







    const fetchCompanies = useCallback(async () => {
        try {
            const response: any = await companyService.getAllCompanies();
            if (response.status) {
                setCompanies(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    }, []);

    const fetchLicenses = useCallback(async () => {
        if (selectedCompanyId === undefined || selectedCompanyId === null || selectedCompanyId === '') return;
        try {
            const req = new IdRequestModel(Number(selectedCompanyId));
            const response: any = await licensesService.getAllLicenses(req);
            if (response.status) {
                const data = response.data || [];
                setLicenses(data);
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to fetch licenses');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to fetch licenses');
        }
    }, [selectedCompanyId]);

    const fetchEmployees = useCallback(async () => {
        const isAdmin = [UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.SUPPORT_ADMIN, UserRoleEnum.SITE_ADMIN].includes(user?.role as UserRoleEnum);
        const companyIdToFetch = isAdmin ? 0 : user?.companyId;

        if (companyIdToFetch === undefined && !isAdmin) return;

        try {
            const req = new IdRequestModel(Number(companyIdToFetch) || 0);
            const response = await employeeService.getAllEmployees(req as any);
            if (response.status) {
                setAllEmployees(response.data || []);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to fetch employees');
        }
    }, [user?.companyId, user?.role]);

    const fetchApplications = useCallback(async () => {
        if (!user?.companyId) return;
        try {
            const response: any = await applicationService.getAllApplications();
            if (response.status) {
                setApplications(response.applications || []);
            }
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        }
    }, [user?.companyId]);

    useEffect(() => {
        fetchCompanies();
        fetchEmployees();
        fetchApplications();
    }, [fetchCompanies, fetchEmployees, fetchApplications]);




    useEffect(() => {
        fetchLicenses();
    }, [fetchLicenses]);


    const handleDeleteClick = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (deletingId) {
            try {
                const model = new DeleteLicenseModel(deletingId);
                const response: any = await licensesService.deleteLicense(model);

                if (response.status) {
                    AlertMessages.getSuccessMessage('Licence removed successfully');
                    fetchLicenses();
                } else {
                    AlertMessages.getErrorMessage(response.message || 'Failed to remove licence');
                }
            } catch (err: any) {
                AlertMessages.getErrorMessage(err.message || 'An error occurred');
            } finally {
                setIsDeleteDialogOpen(false);
                setDeletingId(null);
            }
        }
    };

    const filteredLicenses = useMemo(() => {
        return licenses.filter(l =>
            l.application?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.assignedEmployee?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.assignedEmployee?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [licenses, searchQuery]);

    const groupedData = useMemo(() => {
        const groups: Record<string, License[]> = {};
        filteredLicenses.forEach(license => {
            const appName = license.application?.name || 'Unassigned Application';
            if (!groups[appName]) groups[appName] = [];
            groups[appName].push(license);
        });
        return groups;
    }, [filteredLicenses]);

    const assignedCount = useMemo(() => licenses.filter(l => l.assignedEmployeeId).length, [licenses]);



    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-950/40 space-y-8 pb-32">
                {/* Header Section */}
                <PageHeader
                    title="Software Licenses"
                    description="Enterprise software asset management"
                    icon={<Shield />}
                    gradient="from-slate-800 to-slate-900"
                    actions={[

                        {
                            label: 'Add License',
                            onClick: () => { setEditLicense(null); setIsModalOpen(true); },
                            icon: <Plus className="h-3.5 w-3.5" />,
                            variant: 'primary'
                        }
                    ]}
                >
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-end max-w-2xl ml-auto">
                        <div className="w-full sm:w-48">
                            <Select
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                options={[
                                    { value: '0', label: 'All Companies' },
                                    ...companies.map((c) => ({
                                        value: c.id.toString(),
                                        label: c.companyName
                                    }))
                                ]}
                                className="h-8 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            />
                        </div>

                        <div className="relative w-full sm:w-72 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search licences..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-xs outline-none shadow-sm"
                            />
                        </div>
                    </div>
                </PageHeader>



                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Summary Metrics */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Assigned Licenses</div>
                                <div className="text-3xl font-black text-emerald-500 flex items-baseline gap-2">
                                    {assignedCount}
                                    <span className="text-xs text-slate-400 font-bold">Assigned</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Registry Content */}
                    <div className="lg:col-span-3 space-y-3">
                        <>
                            {licenses.length === 0 ? (
                                <div className="h-[450px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5 shadow-inner">
                                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/20 rounded-3xl flex items-center justify-center mb-8 shadow-inner animate-pulse">
                                        <Key className="h-8 w-8 text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Licences Found</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 max-w-xs font-medium leading-relaxed uppercase tracking-[0.1em]">
                                        Add a new software licence to get started.
                                    </p>
                                </div>
                            ) : (
                                Object.entries(groupedData).map(([appName, appLicenses]) => {
                                    const isExpanded = !!expandedApps[appName];
                                    const firstLicense = appLicenses[0];

                                    return (
                                        <div key={appName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
                                            <button
                                                onClick={() => toggleApp(appName)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                                                        {firstLicense.application?.logo ? (
                                                            <img src={firstLicense.application.logo} alt="" className="w-6 h-6 object-contain" />
                                                        ) : (
                                                            <Shield className="w-5 h-5 text-indigo-500" />
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <h3 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white leading-none mb-1">{appName}</h3>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Software Application</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="hidden sm:flex flex-col items-end mr-2">
                                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                                                            Total Monthly Cost
                                                        </p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                                            ${appLicenses.reduce((sum, l) => sum + (Number(l.costPerSeat) || 0), 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="hidden sm:flex items-center -space-x-2">
                                                        {appLicenses.filter(l => l.assignedEmployeeId).slice(0, 3).map((l, i) => (
                                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500 flex items-center justify-center text-[8px] font-black text-white">
                                                                {l.assignedEmployee 
                                                                    ? (l.assignedEmployee.firstName?.[0] || '') + (l.assignedEmployee.lastName?.[0] || '')
                                                                    : 'U'}
                                                            </div>
                                                        ))}
                                                        {appLicenses.filter(l => l.assignedEmployeeId).length > 3 && (
                                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                                +{appLicenses.filter(l => l.assignedEmployeeId).length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/10">
                                                        {appLicenses.length}
                                                    </div>
                                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-slate-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-200 dark:border-white/5">

                                                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Company</th>
                                                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Employee</th>
                                                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Allocation Date</th>
                                                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cost</th>
                                                                    <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {appLicenses.map((license: License, idx: number) => {

                                                                    return (
                                                                        <tr key={license.id} className={`group/row border-b last:border-0 border-slate-200 dark:border-white/[0.02] hover:bg-slate-50/50 dark:hover:bg-indigo-500/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/[0.01]'}`}>

                                                                            <td className="p-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Building2 className="w-3.5 h-3.5 text-indigo-500/50" />
                                                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                                                                        {license.company?.companyName || 'N/A'}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-4">
                                                                                {license.assignedEmployeeId ? (
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-indigo-600/20">
                                                                                            {license.assignedEmployee 
                                                                                                ? `${license.assignedEmployee.firstName[0]}${license.assignedEmployee.lastName[0]}`
                                                                                                : 'U'}
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                                                {license.assignedEmployee 
                                                                                                    ? `${license.assignedEmployee.firstName} ${license.assignedEmployee.lastName}`
                                                                                                    : `Employee #${license.assignedEmployeeId}`}
                                                                                            </p>
                                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active User</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-3 opacity-40">
                                                                                        <div className="w-8 h-8 rounded-lg border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center capitalize">
                                                                                            <Plus className="w-3 h-3 text-slate-400" />
                                                                                        </div>
                                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unassigned</span>
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${license.role === 'Owner' ? 'bg-amber-50 text-amber-600 border-amber-200' : (license.role === 'Member' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200')}`}>
                                                                                        {license.role || 'Member'}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Clock className="w-3.5 h-3.5 text-indigo-500/50" />
                                                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                                                                        {license.assignedDate ? new Date(license.assignedDate).toLocaleDateString() : 'N/A'}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-4">
                                                                                <div className="flex flex-col">
                                                                                    {license.costPerSeat && license.costPerSeat > 0 ? (
                                                                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/10 w-fit">
                                                                                            ${Number(license.costPerSeat).toLocaleString()} / {license.billingCycle?.toLowerCase() || 'monthly'}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Free / N/A</span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-4 text-right">
                                                                                <div className="flex items-center justify-end gap-1">
                                                                                    <button
                                                                                        onClick={() => { setEditLicense(license); setIsModalOpen(true); }}
                                                                                        className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                                                                                    >
                                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteClick(license.id)}
                                                                                        className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                                                                                    >
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </>
                    </div>
                </div>

                <AddLicenseModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditLicense(null); }}
                    initialLicense={editLicense}
                    onSuccess={async (data) => {
                        try {
                            if (editLicense) {
                                const model = new UpdateLicenseModel(
                                    editLicense.id,
                                    Number(data.companyId),
                                    Number(data.applicationId),
                                    data.assignedEmployeeId ? Number(data.assignedEmployeeId) : undefined,
                                    data.licenseKey || undefined,
                                    undefined, // purchaseDate
                                    data.assignedDate ? new Date(data.assignedDate) : undefined,
                                    undefined, // expiryDate
                                    undefined, // seats
                                    data.remarks || undefined,
                                    Number(data.costPerSeat),
                                    data.billingCycle,
                                    data.role
                                );
                                const response: any = await licensesService.updateLicense(model);
                                if (response.status) {
                                    AlertMessages.getSuccessMessage('Licence updated successfully');
                                    fetchLicenses();
                                    return true;
                                } else {
                                    AlertMessages.getErrorMessage(response.message || 'Failed to update licence');
                                    return false;
                                }
                            } else {
                                const model = new CreateLicenseModel(
                                    Number(data.companyId),
                                    Number(data.applicationId),
                                    data.assignedEmployeeId ? Number(data.assignedEmployeeId) : undefined,
                                    data.licenseKey || undefined,
                                    undefined, // purchaseDate
                                    data.assignedDate ? new Date(data.assignedDate) : undefined,
                                    undefined, // expiryDate
                                    undefined, // seats
                                    data.remarks || undefined,
                                    Number(data.costPerSeat),
                                    data.billingCycle,
                                    data.role
                                );

                                const response: any = await licensesService.createLicense(model);
                                if (response.status) {
                                    AlertMessages.getSuccessMessage('Licence added successfully');
                                    fetchLicenses();
                                    return true;
                                } else {
                                    AlertMessages.getErrorMessage(response.message || 'Failed to add licence');
                                    return false;
                                }
                            }
                        } catch (err: any) {
                            AlertMessages.getErrorMessage(err.message || 'An error occurred');
                            return false;
                        }
                    }}
                    companies={companies}
                    applications={applications as any}
                    employees={allEmployees}
                />

                <DeleteConfirmDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    itemName="Licence Entry"
                />

            </div>
        </RouteGuard>
    );
}

const exportLicensesPage = LicensesPage;
export { exportLicensesPage as LicensesPage };