'use client';

import { useState, useEffect, useRef } from 'react';
import { CreateSlackUserModel, UpdateSlackUserModel, SlackUserModel, IdRequestModel, CompanyDropdownModel, GetAllEmployeesRequestModel } from '@bosvault/shared-models';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Plus, Pencil, Trash2, ArrowLeft, User, Search, LayoutGrid, List, Eye, Slack, Hash, Shield, Phone, Mail, AtSign, Briefcase, MapPin, Globe, Activity, Settings, RefreshCw } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { DepartmentService, EmployeesService, SlackUserService, CompanyService } from '@bosvault/shared-services';
import { formatPhoneNumberWithCountryCode } from '@/lib/utils';

interface EmployeeOption {
    id: number;
    name: string;
    email: string;
    phone: string;
    department: string;
    slackUserId?: string;
    manager?: string;
}

interface SlackUsersMasterViewProps {
    onBack?: () => void;
}

interface DepartmentInfo {
    id: number;
    name: string;
}

const ImageWithFallback: React.FC<{
    src?: string;
    alt: string;
    className?: string;
    fallback: React.ReactNode;
}> = ({ src, alt, className, fallback }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [src]);

    if (!src || imgError) {
        return <>{fallback}</>;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setImgError(true)}
        />
    );
};

export const SlackUsersMasterView: React.FC<SlackUsersMasterViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [users, setUsers] = useState<SlackUserModel[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const slackUserService = new SlackUserService();
    const departmentService = new DepartmentService();
    const employeeService = new EmployeesService();
    const companyService = new CompanyService();
    const [companies, setCompanies] = useState<CompanyDropdownModel[]>([]);
    const [filterCompanyId, setFilterCompanyId] = useState<string>('all');
    const [formData, setFormData] = useState({ name: '', email: '', slackUserId: '', displayName: '', role: '', phone: '', notes: '', companyId: '', employeeId: '', isActive: true, avatarUrl: '', isAdmin: false });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedSlackUser, setSelectedSlackUser] = useState<SlackUserModel | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [configCompanyId, setConfigCompanyId] = useState<string>('');
    const [configFormData, setConfigFormData] = useState({ slackBotToken: '', slackWorkspaceId: '' });
    const [isSyncing, setIsSyncing] = useState(false);
    const lastFetchedCompanyId = useRef<number | null>(null);

    useEffect(() => {
        if (user?.companyId && lastFetchedCompanyId.current !== user.companyId) {
            lastFetchedCompanyId.current = user.companyId;
            getAllSlackUsers();
            fetchDependencies();
        }
    }, [user?.companyId]);

    const getAllSlackUsers = async (): Promise<void> => {
        try {
            const response = await slackUserService.getAllSlackUsers();
            if (response.status) {
                setUsers(response.slackUsers || []);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const fetchDependencies = async (): Promise<void> => {
        try {
            const req = new GetAllEmployeesRequestModel(user?.companyId || 0);
            const [empRes, deptRes, compRes] = await Promise.all([
                employeeService.getAllEmployees(req),
                departmentService.getAllDepartments(),
                companyService.getAllCompaniesDropdown()
            ]);

            if (empRes.status && empRes.data) {
                setEmployees(empRes.data.map((e: any) => ({
                    id: e.id,
                    name: `${e.firstName} ${e.lastName}`,
                    email: e.email,
                    phone: e.phNumber,
                    department: e.departmentName,
                    slackUserId: e.slackUserId,
                    manager: e.managerName
                })));
            }

            if (deptRes.status && deptRes.departments) {
                setDepartments(deptRes.departments);
            }

            if (compRes.status && compRes.data) {
                setCompanies(compRes.data);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const handleEmployeeSelect = (employeeId: string): void => {
        if (!employeeId) {
            setFormData(prev => ({ ...prev, employeeId: '' }));
            return;
        }
        const emp = employees.find(e => e.id.toString() === employeeId);
        if (emp) {
            setFormData(prev => ({
                ...prev,
                name: emp.name,
                email: emp.email,
                phone: emp.phone || '',
                slackUserId: emp.slackUserId || '',
                employeeId: emp.id.toString()
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            const companyIdToUse = Number(formData.companyId) || user?.companyId || 0;
            if (isEditMode && editingId) {
                const model = new UpdateSlackUserModel(editingId, formData.name, formData.email, undefined, formData.isActive, formData.slackUserId, formData.displayName, formData.role, formData.phone, formData.notes, companyIdToUse, formData.avatarUrl, formData.employeeId ? Number(formData.employeeId) : undefined, formData.isAdmin);
                const response = await slackUserService.updateSlackUser(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllSlackUsers();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateSlackUserModel(user?.id || 0, companyIdToUse, formData.name, formData.email, undefined, formData.isActive ?? true, formData.slackUserId, formData.displayName, formData.role, formData.phone, formData.notes, formData.avatarUrl, formData.employeeId ? Number(formData.employeeId) : undefined);
                const response = await slackUserService.createSlackUser(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllSlackUsers();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'An error occurred');
        }
    };

    const handleEdit = (item: SlackUserModel): void => {
        setIsEditMode(true);
        setEditingId(item.id);
        setFormData({
            name: item.name,
            email: item.email,
            slackUserId: item.slackUserId || '',
            displayName: item.displayName || '',
            role: item.role || '',

            phone: item.phone || '',
            notes: item.notes || '',
            companyId: item.companyId?.toString() || '',
            employeeId: item.employeeId?.toString() || '',
            isActive: item.isActive ?? true,
            avatarUrl: item.avatarUrl || '',
            isAdmin: item.isAdmin ?? false
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number): void => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async (): Promise<void> => {
        if (deletingId) {
            try {
                const req = new IdRequestModel(deletingId);
                const response = await slackUserService.deleteSlackUser(req);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    getAllSlackUsers();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } catch (err: any) {
                AlertMessages.getErrorMessage(err.message);
            }
        }
    };

    const handleCloseModal = (): void => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', email: '', slackUserId: '', displayName: '', role: '', phone: '', notes: '', companyId: '', employeeId: '', isActive: true, avatarUrl: '', isAdmin: false });
    };

    const handleOpenConfig = async (companyId: string) => {
        if (!companyId || companyId === 'all') {
            AlertMessages.getErrorMessage('Please select a company to configure Slack settings.');
            return;
        }
        setConfigCompanyId(companyId);
        try {
            const response = await companyService.getAllCompanies();
            if (response.status) {
                const comp = response.data.find((c: any) => c.id.toString() === companyId);
                if (comp) {
                    setConfigFormData({
                        slackBotToken: comp.slackBotToken || '',
                        slackWorkspaceId: comp.slackWorkspaceId || ''
                    });
                    setIsConfigModalOpen(true);
                }
            }
        } catch (error) {
            AlertMessages.getErrorMessage('Failed to fetch company settings');
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await companyService.updateCompany({
                id: Number(configCompanyId),
                slackBotToken: configFormData.slackBotToken,
                slackWorkspaceId: configFormData.slackWorkspaceId
            } as any);

            if (response.status) {
                AlertMessages.getSuccessMessage('Slack settings saved successfully');
                setIsConfigModalOpen(false);
                fetchDependencies(); // Refresh companies list
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const handleSyncFromSlack = async () => {
        if (!filterCompanyId || filterCompanyId === 'all') {
            AlertMessages.getErrorMessage('Please select a specific company to sync members from Slack.');
            return;
        }
        setIsSyncing(true);
        try {
            const response = await slackUserService.importSlackUsers(Number(filterCompanyId));
            if (response.status) {
                AlertMessages.getSuccessMessage(response.message);
                getAllSlackUsers();
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const filteredUsers = users.filter((u: SlackUserModel) => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCompany = filterCompanyId === 'all' || u.companyId?.toString() === filterCompanyId;

        return matchesSearch && matchesCompany;
    });

    return (
        <>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden h-[600px] flex flex-col p-0">
                <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Slack Users</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 mr-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                        <select
                            value={filterCompanyId}
                            onChange={(e) => setFilterCompanyId(e.target.value)}
                            className="hidden md:block px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        >
                            <option value="all">All Companies</option>
                            {companies.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                    {comp.name}
                                </option>
                            ))}
                        </select>
                        <div className="relative w-48 hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full pl-10 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {onBack && (
                            <Button size="xs" variant="primary" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                Back to Masters
                            </Button>
                        )}
                        <Button
                            size="xs"
                            variant="outline"
                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            leftIcon={<Settings className="h-4 w-4" />}
                            onClick={() => handleOpenConfig(filterCompanyId)}
                        >
                            Config
                        </Button>
                        <Button
                            size="xs"
                            variant="secondary"
                            className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-100"
                            leftIcon={<RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />}
                            onClick={handleSyncFromSlack}
                            disabled={isSyncing}
                        >
                            Sync Slack
                        </Button>
                        <Button size="xs" variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
                                <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-center">User</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-center">Company</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-center">Slack ID</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border border-slate-200 dark:border-slate-700">Status</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border border-slate-200 dark:border-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">No users found</td></tr>
                                    ) : (
                                        filteredUsers.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-800 overflow-hidden shadow-sm">
                                                            <ImageWithFallback
                                                                src={item.avatarUrl}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                fallback={<User className="h-5 w-5" />}
                                                            />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-tight">{item.name}</div>
                                                                {item.isAdmin && (
                                                                    <Shield className="h-3 w-3 text-indigo-500" />
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">{item.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">{item.companyName || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 border border-slate-200 dark:border-slate-700 text-center">
                                                    {item.slackUserId ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">{item.slackUserId}</span>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center border border-slate-200 dark:border-slate-700">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${item.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                                        }`}>
                                                        {item.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center border border-slate-200 dark:border-slate-700">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => { setSelectedSlackUser(item); setIsDetailModalOpen(true); }} className="h-7 w-7 flex items-center justify-center rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm" title="View">
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleEdit(item)} className="h-7 w-7 flex items-center justify-center rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm" title="Edit">
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(item.id)} className="h-7 w-7 flex items-center justify-center rounded bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm" title="Delete">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredUsers.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <p>No users found</p>
                                </div>
                            ) : (
                                filteredUsers.map((item) => (
                                    <div key={item.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1">
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="relative group/avatar">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-110 transition-transform">
                                                        <ImageWithFallback
                                                            src={item.avatarUrl}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                            fallback={<Slack className="h-6 w-6" />}
                                                        />
                                                    </div>
                                                    {item.isAdmin && (
                                                        <div className="absolute -top-1 -right-1 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm z-10">
                                                            <Shield className="h-3 w-3 text-indigo-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setSelectedSlackUser(item); setIsDetailModalOpen(true); }} className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"><Eye className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"><Pencil className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{item.companyName || 'Standard'}</span>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">{item.name}</h4>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.email}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${item.isActive
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                            : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                                            }`}>
                                                            {item.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                        {item.isAdmin && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800">
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.slackUserId && (
                                                        <span className="flex items-center gap-1 text-[9px] text-indigo-500 font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                                                            <Hash className="h-3 w-3" /> {item.slackUserId}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <Briefcase className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">{item.role || 'Member'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? "Edit Slack User" : "Add Slack User"} size="lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employee (Optional)</label>
                        <select
                            value={formData.employeeId}
                            onChange={(e) => handleEmployeeSelect(e.target.value)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name} {emp.slackUserId ? `(${emp.slackUserId})` : ''} {emp.manager ? ` - Mgr: ${emp.manager}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14" required />
                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-14" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                            <select
                                value={formData.companyId}
                                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                <option value="">Select Company</option>
                                {companies.map((comp) => (
                                    <option key={comp.id} value={comp.id}>
                                        {comp.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Slack User ID" value={formData.slackUserId} onChange={(e) => setFormData({ ...formData, slackUserId: e.target.value })} className="h-14" />
                        <Input label="Display Name" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="h-14" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="h-14" />
                        <PhoneInput label="Phone" value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} />
                    </div>

                    <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="h-14" />

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <Button variant="outline" onClick={handleCloseModal} type="button">Cancel</Button>
                        <Button variant="primary" type="submit">{isEditMode ? 'Update User' : 'Create User'}</Button>
                    </div>
                </form>
            </Modal>

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName="Slack User"
            />

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Slack Member Profile"
                size="md"
            >
                {selectedSlackUser && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800 shadow-md relative z-10 overflow-hidden">
                                    <ImageWithFallback
                                        src={selectedSlackUser.avatarUrl}
                                        alt={selectedSlackUser.name}
                                        className="w-full h-full object-cover"
                                        fallback={<User className="h-12 w-12" />}
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm z-20">
                                    <Slack className="h-5 w-5 text-[#4A154B]" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedSlackUser.name}</h4>
                                <div className="flex flex-col items-center gap-1 mt-1">
                                    <div className="flex items-center justify-center gap-2">
                                        <AtSign className="h-3 w-3 text-slate-400" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedSlackUser.displayName || 'no-display-name'}</span>
                                    </div>
                                    {selectedSlackUser.isAdmin && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 mt-1">
                                            <Shield className="h-3 w-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Workspace Administrator</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={`mt-4 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${selectedSlackUser.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                }`}>
                                {selectedSlackUser.isActive ? 'Active Account' : 'Inactive Account'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Hash className="h-3.5 w-3.5 text-indigo-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Slack User ID</span>
                                    </div>
                                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">{selectedSlackUser.slackUserId || 'Not synced'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Designation</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedSlackUser.role || 'Member'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{selectedSlackUser.email}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contact Number</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatPhoneNumberWithCountryCode(selectedSlackUser.phone) || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Organization</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{selectedSlackUser.companyName || 'Not specified'}</p>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe className="h-3.5 w-3.5 text-orange-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Timezone</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{selectedSlackUser.timezone || 'Not set'} ({selectedSlackUser.timezoneLabel || 'UTC'})</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity className="h-3.5 w-3.5 text-cyan-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Slack Team ID</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedSlackUser.teamId || 'Default'}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Member Notes</label>
                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                                    {selectedSlackUser.notes || 'No administrative notes available for this Slack member.'}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50">
                                    <Shield className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                        Profile synchronization is enabled. Changes made here may be overwritten by Slack API sync.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Slack Integration Settings" size="md">
                <form onSubmit={handleSaveConfig} className="space-y-6">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl mb-6">
                        <div className="flex gap-3">
                            <Slack className="h-5 w-5 text-indigo-600 shrink-0" />
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
                                Configure your Slack Bot Token and Workspace ID here. These credentials are required to sync members and profile data.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Slack Bot Token"
                            value={configFormData.slackBotToken}
                            onChange={(e) => setConfigFormData({ ...configFormData, slackBotToken: e.target.value })}
                            placeholder="xoxb-..."
                            className="h-14"
                        />
                        <Input
                            label="Slack Workspace ID"
                            value={configFormData.slackWorkspaceId}
                            onChange={(e) => setConfigFormData({ ...configFormData, slackWorkspaceId: e.target.value })}
                            placeholder="T0123..."
                            className="h-14"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="outline" onClick={() => setIsConfigModalOpen(false)} type="button">Cancel</Button>
                        <Button variant="primary" type="submit">Save Configuration</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
