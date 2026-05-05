'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, ShieldCheck, Plus, Search, CheckCircle, Clock, Mail, Eye, EyeOff, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum, IdRequestModel, RegisterUserModel, DeleteUserModel, UpdateUserModel } from '@bosvault/shared-models';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Select } from '@/components/ui/Select';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { authService } from '@/lib/api/services';
import { useAuth } from '@/contexts/AuthContext';

const TABS = [
    { id: 'create-user', label: 'Create Login User', icon: UserPlus },
    { id: 'access-requests', label: 'Access Requests', icon: ShieldCheck },
];

const ROLE_OPTIONS = [
    { value: UserRoleEnum.USER, label: 'User' },
    { value: UserRoleEnum.MANAGER, label: 'Manager' },
    { value: UserRoleEnum.SUPPORT_ADMIN, label: 'Support Admin' },
    { value: UserRoleEnum.SUPER_ADMIN, label: 'Super Admin' },
];

interface UserRow {
    id: number;
    fullName: string;
    email: string;
    phNumber?: string;
    userRole: string;
    status: boolean;
    createdAt: Date;
}

interface AccessRequest {
    id: number;
    name: string;
    email: string;
    description?: string;
    status: string;
    createdAt: Date;
}

const defaultForm = {
    fullName: '',
    email: '',
    password: '',
    phNumber: '',
    role: UserRoleEnum.USER as string,
};

export default function UsersManagementPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<string>('create-user');

    // Users tab state
    const [users, setUsers] = useState<UserRow[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    // Access Requests tab state
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [reqLoading, setReqLoading] = useState(false);
    const [reqSearch, setReqSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ ...defaultForm });
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fromRequestId, setFromRequestId] = useState<number | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [deleteTargetUser, setDeleteTargetUser] = useState<UserRow | null>(null);
    const [deletingReqId, setDeletingReqId] = useState<number | null>(null);
    const [deleteTargetReq, setDeleteTargetReq] = useState<AccessRequest | null>(null);

    // Edit state
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!user?.companyId) return;
        setUsersLoading(true);
        try {
            const res = await authService.getAllUsers(new IdRequestModel(user.companyId));
            if (res.status) {
                setUsers(res.users || []);
            } else {
                AlertMessages.getErrorMessage(res.message || 'Failed to load users');
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    }, [user?.companyId]);

    const fetchAccessRequests = useCallback(async () => {
        setReqLoading(true);
        try {
            const res = await authService.getAccessRequests() as any;
            if (res.status) {
                setAccessRequests(res.requests || []);
            } else {
                AlertMessages.getErrorMessage(res.message || 'Failed to load access requests');
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to load access requests');
        } finally {
            setReqLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'create-user') fetchUsers();
        else if (activeTab === 'access-requests') fetchAccessRequests();
    }, [activeTab, fetchUsers, fetchAccessRequests]);

    const openCreateModal = () => {
        setFormData({ ...defaultForm });
        setFromRequestId(null);
        setShowPassword(false);
        setIsEditMode(false);
        setEditingUserId(null);
        setIsModalOpen(true);
    };

    const openCreateFromRequest = (req: AccessRequest) => {
        setFormData({ ...defaultForm, fullName: req.name, email: req.email });
        setFromRequestId(req.id);
        setShowPassword(false);
        setIsEditMode(false);
        setEditingUserId(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ ...defaultForm });
        setFromRequestId(null);
        setIsEditMode(false);
        setEditingUserId(null);
    };

    const openEditModal = (u: UserRow) => {
        setIsEditMode(true);
        setEditingUserId(u.id);
        setFormData({
            fullName: u.fullName,
            email: u.email,
            password: '',
            phNumber: u.phNumber || '',
            role: u.userRole as UserRoleEnum,
        });
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (u: UserRow) => {
        setDeleteTargetUser(u);
    };

    const confirmDeleteUser = async () => {
        if (!deleteTargetUser) return;
        const u = deleteTargetUser;
        setDeletingUserId(u.id);
        setDeleteTargetUser(null);
        try {
            const res = await authService.deleteUser(new DeleteUserModel(u.email));
            if (res.status) {
                AlertMessages.getSuccessMessage(`User "${u.fullName}" deleted.`);
                fetchUsers();
            } else {
                AlertMessages.getErrorMessage(res.message || 'Failed to delete user');
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to delete user');
        } finally {
            setDeletingUserId(null);
        }
    };

    const handleDeleteRequest = (req: AccessRequest) => {
        setDeleteTargetReq(req);
    };

    const confirmDeleteRequest = async () => {
        if (!deleteTargetReq) return;
        const id = deleteTargetReq.id;
        setDeletingReqId(id);
        setDeleteTargetReq(null);
        try {
            const res = await authService.deleteAccessRequest(id);
            if (res.status) {
                AlertMessages.getSuccessMessage('Access request deleted');
                fetchAccessRequests();
            } else {
                AlertMessages.getErrorMessage(res.message || 'Failed to delete request');
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to delete request');
        } finally {
            setDeletingReqId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const requestId = fromRequestId;
        setSubmitting(true);
        const fullPhNumber = formData.phNumber;

        try {
            if (isEditMode && editingUserId) {
                const model = new UpdateUserModel(
                    editingUserId,
                    formData.fullName,
                    user?.companyId || 0,
                    formData.email,
                    fullPhNumber,
                    formData.password || undefined,
                    formData.role as UserRoleEnum
                );
                const res = await authService.updateUser(model);
                if (res.status) {
                    handleCloseModal();
                    AlertMessages.getSuccessMessage('User updated successfully!');
                    fetchUsers();
                } else {
                    AlertMessages.getErrorMessage(res.message || 'Failed to update user');
                }
            } else {
                if (!formData.password) {
                    AlertMessages.getErrorMessage('Password is required');
                    setSubmitting(false);
                    return;
                }
                const model = new RegisterUserModel(
                    formData.fullName,
                    user?.companyId || 0,
                    formData.email,
                    fullPhNumber,
                    formData.password,
                    formData.role as UserRoleEnum,
                );
                const res = await authService.registerUser(model);
                if (res.status) {
                    handleCloseModal();
                    AlertMessages.getSuccessMessage(res.message || 'User created successfully!');
                    fetchUsers();
                    if (requestId !== null) {
                        setAccessRequests(prev =>
                            prev.map(r => r.id === requestId ? { ...r, status: 'COMPLETED' } : r)
                        );
                        setActiveTab('access-requests');
                        authService.closeAccessRequest(requestId)
                            .then(() => fetchAccessRequests())
                            .catch(() => fetchAccessRequests());
                    }
                } else {
                    AlertMessages.getErrorMessage(res.message || 'Failed to create user');
                }
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to process request');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const q = userSearch.toLowerCase();
        return !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.userRole?.toLowerCase().includes(q);
    });

    const filteredRequests = accessRequests.filter(r => {
        const q = reqSearch.toLowerCase();
        return !q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
    });

    const getRoleBadge = (role: string) => {
        const map: Record<string, string> = {
            super_admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            admin: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            site_admin: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
            manager: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
            support_admin: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
            viewer: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
            user: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        };
        return map[role?.toLowerCase()] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    };

    const formatDate = (d: Date | string) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getInitials = (name: string) =>
        name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN]}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 lg:p-8 space-y-8">

                <PageHeader
                    title="Manage Users"
                    description="Manage login user accounts and access requests."
                    icon={<Users />}
                    gradient="from-indigo-600 to-indigo-700"
                    actions={activeTab === 'create-user' ? [
                        {
                            label: 'Add User',
                            onClick: openCreateModal,
                            icon: <Plus className="h-3.5 w-3.5" />,
                            variant: 'primary',
                        }
                    ] : []}
                />

                {/* Tabs */}
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-1.5 w-fit">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">

                    {/* ── Create Login User Tab ── */}
                    {activeTab === 'create-user' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Toolbar */}
                            <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                                    />
                                </div>
                                <span className="text-xs text-slate-400 font-medium">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
                            </div>

                            {usersLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full mb-3">
                                        <Users className="h-6 w-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-white">No users found</p>
                                    <p className="text-xs text-slate-400 mt-1">Click "Add User" to create the first login user</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-700">
                                        <tr>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Created</th>
                                            <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                            {getInitials(u.fullName)}
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-800 dark:text-white">{u.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 hidden md:table-cell">
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <Mail className="h-3 w-3 opacity-60" />
                                                        {u.email}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${getRoleBadge(u.userRole)}`}>
                                                        {u.userRole?.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 hidden sm:table-cell">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${u.status
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}>
                                                        <span className={`w-1 h-1 rounded-full ${u.status ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                        {u.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-slate-400">
                                                    {formatDate(u.createdAt)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                            title="Edit user"
                                                            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u)}
                                                            disabled={deletingUserId === u.id}
                                                            title="Delete user"
                                                            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                                                        >
                                                            {deletingUserId === u.id
                                                                ? <span className="animate-spin rounded-full h-3 w-3 border-2 border-red-400 border-t-transparent" />
                                                                : <Trash2 className="h-3.5 w-3.5" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* ── Access Requests Tab ── */}
                    {activeTab === 'access-requests' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Toolbar */}
                            <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search requests..."
                                        value={reqSearch}
                                        onChange={e => setReqSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 h-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-2 py-1 font-medium">
                                        <Clock className="h-3 w-3" />
                                        {accessRequests.filter(r => r.status?.toUpperCase() !== 'COMPLETED').length} Pending
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-md px-2 py-1 font-medium">
                                        <CheckCircle className="h-3 w-3" />
                                        {accessRequests.filter(r => r.status?.toUpperCase() === 'COMPLETED').length} Completed
                                    </span>
                                </div>
                            </div>

                            {reqLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full mb-3">
                                        <ShieldCheck className="h-6 w-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-white">No requests found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-700">
                                            <tr>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Requested On</th>
                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {filteredRequests.map(r => (
                                                <tr key={r.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-xs font-semibold text-slate-800 dark:text-white">{r.name}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5 hidden md:table-cell">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">{r.email}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${r.status?.toUpperCase() === 'COMPLETED'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                                            }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-slate-400">
                                                        {formatDate(r.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {r.status?.toUpperCase() !== 'COMPLETED' && (
                                                                <button
                                                                    onClick={() => openCreateFromRequest(r)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                                                                >
                                                                    <UserPlus className="h-3 w-3" />
                                                                    Approve
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteRequest(r)}
                                                                disabled={deletingReqId === r.id}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                                                                title="Delete request"
                                                            >
                                                                {deletingReqId === r.id
                                                                    ? <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-400 border-t-transparent" />
                                                                    : <Trash2 className="h-3.5 w-3.5" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Add/Edit User Modal ── */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={isEditMode ? 'Edit User' : (fromRequestId ? 'Register User from Access Request' : 'Create Login User')}
                    size="sm"
                >
                    {fromRequestId && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-2.5">
                            <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">Approving Request</p>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400">Creating login credentials for this request will automatically notify the user.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            required
                            disabled={submitting}
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={submitting || isEditMode}
                        />
                        {/* Password with show/hide toggle */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Password {!isEditMode && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!isEditMode}
                                    disabled={submitting}
                                    placeholder={isEditMode ? "Leave blank to keep current" : "Set a strong password"}
                                    className="w-full px-2.5 py-1.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>
                        <PhoneInput
                            label="Phone Number"
                            value={formData.phNumber}
                            onChange={(val) => setFormData({ ...formData, phNumber: val })}
                            required
                            disabled={submitting}
                        />
                        <Select
                            label="Role"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            options={ROLE_OPTIONS}
                            disabled={submitting}
                        />
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <Button variant="outline" type="button" onClick={handleCloseModal} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={submitting}>
                                {submitting ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </span>
                                ) : (isEditMode ? 'Update User' : 'Create User')}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* ── Delete User Confirmation Modal ── */}
                <Modal
                    isOpen={!!deleteTargetUser}
                    onClose={() => setDeleteTargetUser(null)}
                    title="Delete User"
                    size="sm"
                >
                    <div className="flex flex-col items-center text-center gap-3 py-2">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                Delete <span className="text-red-500">{deleteTargetUser?.fullName}</span>?
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {deleteTargetUser?.email}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-1 w-full">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setDeleteTargetUser(null)}
                            >
                                Cancel
                            </Button>
                            <button
                                onClick={confirmDeleteUser}
                                disabled={!!deletingUserId}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {deletingUserId ? (
                                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* ── Delete Request Confirmation Modal ── */}
                <Modal
                    isOpen={!!deleteTargetReq}
                    onClose={() => setDeleteTargetReq(null)}
                    title="Delete Access Request"
                    size="sm"
                >
                    <div className="flex flex-col items-center text-center gap-3 py-2">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Trash2 className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                Delete request from <span className="text-red-500">{deleteTargetReq?.name}</span>?
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {deleteTargetReq?.email}
                            </p>
                        </div>
                        <div className="flex gap-2 pt-1 w-full">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setDeleteTargetReq(null)}
                            >
                                Cancel
                            </Button>
                            <button
                                onClick={confirmDeleteRequest}
                                disabled={!!deletingReqId}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {deletingReqId ? (
                                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>

            </div>
        </RouteGuard>
    );
}
