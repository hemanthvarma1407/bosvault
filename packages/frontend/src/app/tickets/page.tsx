'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ticketService, authService, departmentService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    Search, Edit, Trash2, Ticket, Clock, MessageSquare,
    Monitor, Cpu, Wifi, Mail, Lock, HelpCircle,
    AlertTriangle, CheckCircle, User, Users, Filter, Building2
} from 'lucide-react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { TicketCategoryEnum, TicketPriorityEnum, TicketStatusEnum, IdRequestModel, CreateTicketModel, UpdateTicketModel, DeleteTicketModel, UserRoleEnum, TicketSeverityEnum } from '@bosvault/shared-models';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { getSocket } from '@/lib/socket';

const CategoryConfig: Record<string, { icon: any, color: string, bg: string, gradient: string }> = {
    [TicketCategoryEnum.HARDWARE]: {
        icon: Monitor,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        gradient: 'from-blue-500 to-cyan-500'
    },
    [TicketCategoryEnum.SOFTWARE]: {
        icon: Cpu,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        gradient: 'from-purple-500 to-pink-500'
    },
    [TicketCategoryEnum.NETWORK]: {
        icon: Wifi,
        color: 'text-cyan-600 dark:text-cyan-400',
        bg: 'bg-cyan-50 dark:bg-cyan-900/20',
        gradient: 'from-cyan-500 to-teal-500'
    },
    [TicketCategoryEnum.EMAIL]: {
        icon: Mail,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        gradient: 'from-indigo-500 to-blue-500'
    },
    [TicketCategoryEnum.ACCESS]: {
        icon: Lock,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-900/20',
        gradient: 'from-rose-500 to-pink-500'
    },
    [TicketCategoryEnum.REAL_ESTATE]: {
        icon: Building2,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        gradient: 'from-emerald-500 to-green-500'
    },
    [TicketCategoryEnum.OTHER]: {
        icon: HelpCircle,
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-50 dark:bg-slate-800',
        gradient: 'from-slate-500 to-gray-500'
    },
};

export const SUB_CATEGORY_MAP: Record<TicketCategoryEnum, string[]> = {
    [TicketCategoryEnum.HARDWARE]: ['desktop', 'laptop', 'printer', 'mobile', 'monitor', 'server', 'other'],
    [TicketCategoryEnum.SOFTWARE]: ['os', 'office', 'erp', 'antivirus', 'browser', 'crm', 'other'],
    [TicketCategoryEnum.NETWORK]: ['internet', 'vpn', 'wifi', 'lan', 'firewall', 'other'],
    [TicketCategoryEnum.EMAIL]: ['outlook', 'webmail', 'smtp', 'password_reset', 'other'],
    [TicketCategoryEnum.ACCESS]: ['folder_access', 'vpn_access', 'erp_access', 'database', 'other'],
    [TicketCategoryEnum.REAL_ESTATE]: ['cleaning', 'repair', 'furniture', 'lighting', 'other'],
    [TicketCategoryEnum.OTHER]: ['other'],
};

interface TicketData {
    id: number;
    subject: string;
    ticketCode: string;
    description?: string;
    priorityEnum: TicketPriorityEnum;
    categoryEnum: TicketCategoryEnum;
    ticketStatus: TicketStatusEnum;
    employeeName?: string;
    employeeEmail?: string;
    createdAt?: string;
    updatedAt?: string;
    slaDeadline?: string;
    location: string;
    assignedGroup: string;
    assignAdminId: string;
    timeSpentMinutes?: number;
}

const TicketsPage: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();



    // Check if user is admin or support admin
    const isAdmin = user && (
        user.role === UserRoleEnum.ADMIN ||
        user.role === UserRoleEnum.SUPER_ADMIN ||
        user.role === UserRoleEnum.SUPPORT_ADMIN ||
        user.role === UserRoleEnum.MANAGER
    );
    const isSuperAdmin = user?.role === UserRoleEnum.SUPER_ADMIN;

    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState<any>(null);
    const [admins, setAdmins] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    // Default to 'my' for non-admins
    const [viewMode, setViewMode] = useState<'all' | 'my'>('my');
    const [showFilters, setShowFilters] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);

    // Update viewMode when user role is known
    useEffect(() => {
        if (isSuperAdmin) {
            setViewMode('all');
        } else {
            setViewMode('my');
        }
    }, [isSuperAdmin]);

    const [formData, setFormData] = useState({
        // Basic Info
        subject: '',
        description: '',
        categoryEnum: TicketCategoryEnum.OTHER,
        subCategory: '',
        priorityEnum: TicketPriorityEnum.MEDIUM,
        severityEnum: TicketSeverityEnum.LOW,
        ticketStatus: TicketStatusEnum.OPEN,
        ticketCode: '',

        // User Details
        department: '',
        contactNumber: '',
        location: '',

        // Admin / Assignment
        assignedGroup: '',
        assignedTo: '',
        assignAdminId: '',

        // SLA & Tracking
        slaType: '',
        responseDueTime: '',
        escalationLevel: 0,
        timeSpentMinutes: 0,

        // Resolution
        rootCause: '',
        resolutionSummary: '',
        closureRemarks: '',

        // Feedback
        userRating: 0,
        userFeedback: '',

        // Comments (simplified for UI, usually would be a list)
        adminComments: '',
        userComments: '',
        internalNotes: ''
    });

    const getCompanyId = useCallback((): number => {
        const storedUser = localStorage.getItem('auth_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        return user?.companyId || 1;
    }, []);

    const fetchAdmins = useCallback(async () => {
        if (!user?.companyId) return;
        try {
            const response = await authService.getAllUsers(new IdRequestModel(user.companyId));
            if (response.status && response.users) {
                setAdmins(response.users);
            }
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        }
    }, [user?.companyId]);

    const fetchTickets = useCallback(async () => {
        // setIsLoading(true);
        try {
            let response: any;
            // Force 'my' view for non-super-admins, regardless of state (double safety)
            const effectiveViewMode = isSuperAdmin ? viewMode : 'my';

            if (effectiveViewMode === 'my') {
                console.log('Fetching MY tickets...');
                response = await ticketService.getMyTickets();
            } else {
                console.log('Fetching ALL tickets...');
                const req = new IdRequestModel(getCompanyId());
                response = await ticketService.getAllTickets(req);
            }

            console.log('Tickets response:', response);

            if (response.status) {
                const ticketData = (response as any).tickets || response.data || [];
                console.log('Parsed ticket data:', ticketData);
                setTickets(ticketData);
            } else {
                // Silently handle auth errors or empty states for better UX
                if (response.statusCode !== 404) {
                    console.error('Failed to fetch tickets:', response.message);
                }
                setTickets([]);
            }
        } catch (error: any) {
            console.error('Error fetching tickets:', error);
        } finally {
            // setIsLoading(false);
        }
    }, [viewMode, getCompanyId, isAdmin]);

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await departmentService.getAllDepartmentsDropdown();
            if (response.status && response.data) {
                setDepartments(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
        fetchAdmins();
        fetchDepartments();
    }, [fetchTickets, fetchAdmins, fetchDepartments]);

    // WebSocket for real-time ticket updates (Admins only)
    useEffect(() => {
        if (!isAdmin) return;

        const socket = getSocket('/tickets');
        socket.emit('joinAdmins');

        socket.on('ticketCreated', () => {
            fetchTickets();
            AlertMessages.getSuccessMessage('New ticket received!');
        });

        socket.on('notification', (notif: any) => {
            fetchTickets();
            AlertMessages.getSuccessMessage(`New Message: ${notif.title || 'Support'}`);
        });

        return () => {
            socket.off('ticketCreated');
            socket.off('notification');
        };
    }, [isAdmin, fetchTickets]);

    const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.ticketCode && ticket.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ticket.employeeName && ticket.employeeName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || ticket.ticketStatus.toLowerCase() === statusFilter.toLowerCase();
        const matchesCategory = categoryFilter === 'all' || ticket.categoryEnum === categoryFilter;
        const matchesPriority = priorityFilter === 'all' || ticket.priorityEnum === priorityFilter;
        return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingTicket) {
                const req = new UpdateTicketModel(
                    editingTicket.id, // 1: id
                    formData.ticketCode, // 2: ticketCode
                    formData.categoryEnum, // 3: categoryEnum
                    formData.priorityEnum, // 4: priorityEnum
                    formData.subject, // 5: subject
                    formData.ticketStatus, // 6: ticketStatus
                    undefined, // 7: employeeId
                    formData.assignAdminId ? Number(formData.assignAdminId) : undefined, // 8: assignAdminId
                    formData.responseDueTime ? (new Date(formData.responseDueTime) as any) : undefined, // 9: expectedCompletionDate
                    undefined, // 10: resolvedAt
                    formData.timeSpentMinutes ? Number(formData.timeSpentMinutes) : undefined, // 11: timeSpentMinutes
                    formData.description, // 12: description
                    formData.subCategory, // 13: subCategory
                    formData.severityEnum, // 14: severityEnum
                    formData.department, // 15: department
                    formData.contactNumber, // 16: contactNumber
                    formData.location, // 17: location
                    undefined, // 18: contactEmail
                    formData.assignedGroup, // 19: assignedGroup
                    formData.slaType, // 20: slaType
                    formData.responseDueTime ? (new Date(formData.responseDueTime) as any) : undefined, // 21: responseDueTime
                    formData.escalationLevel ? Number(formData.escalationLevel) : undefined, // 22: escalationLevel
                    formData.adminComments, // 23: adminComments
                    formData.userComments, // 24: userComments
                    formData.internalNotes, // 25: internalNotes
                    formData.rootCause, // 26: rootCause
                    formData.resolutionSummary, // 27: resolutionSummary
                    undefined, // 28: resolvedBy
                    formData.closureRemarks, // 29: closureRemarks
                    formData.userRating ? Number(formData.userRating) : undefined, // 30: userRating
                    formData.userFeedback // 31: userFeedback
                );
                const response = await ticketService.updateTicket(req);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message || 'Ticket updated successfully');
                    handleCloseModal();
                    fetchTickets();
                } else {
                    AlertMessages.getErrorMessage(response.message || 'Operation failed');
                }
            } else {
                const req = new CreateTicketModel(
                    '', // 1: ticketCode
                    formData.categoryEnum, // 2: categoryEnum
                    formData.priorityEnum, // 3: priorityEnum
                    formData.subject, // 4: subject
                    TicketStatusEnum.OPEN, // 5: ticketStatus
                    undefined, // 6: employeeId
                    formData.assignAdminId ? Number(formData.assignAdminId) : undefined, // 7: assignAdminId
                    formData.responseDueTime ? (new Date(formData.responseDueTime) as any) : undefined, // 8: expectedCompletionDate
                    undefined, // 9: resolvedAt
                    formData.timeSpentMinutes ? Number(formData.timeSpentMinutes) : undefined, // 10: timeSpentMinutes
                    formData.description, // 11: description
                    formData.subCategory, // 12: subCategory
                    formData.severityEnum, // 13: severityEnum
                    formData.department, // 14: department
                    formData.contactNumber, // 15: contactNumber
                    formData.location, // 16: location
                    undefined, // 17: contactEmail
                    formData.assignedGroup, // 18: assignedGroup
                    formData.slaType, // 19: slaType
                    formData.responseDueTime ? (new Date(formData.responseDueTime) as any) : undefined, // 20: responseDueTime
                    formData.escalationLevel ? Number(formData.escalationLevel) : undefined, // 21: escalationLevel
                    formData.adminComments, // 22: adminComments
                    formData.userComments, // 23: userComments
                    formData.internalNotes, // 24: internalNotes
                    formData.rootCause, // 25: rootCause
                    formData.resolutionSummary, // 26: resolutionSummary
                    undefined, // 27: resolvedBy
                    formData.closureRemarks, // 28: closureRemarks
                    formData.userRating ? Number(formData.userRating) : undefined, // 29: userRating
                    formData.userFeedback // 30: userFeedback
                );
                const response = await ticketService.createTicket(req);

                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message || 'Ticket created successfully');
                    handleCloseModal();
                    fetchTickets();
                } else {
                    AlertMessages.getErrorMessage(response.message || 'Operation failed');
                }
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (ticket: any) => {
        setEditingTicket(ticket);
        setFormData({
            subject: ticket.subject,
            description: ticket.description || '',
            categoryEnum: ticket.categoryEnum,
            subCategory: ticket.subCategory || '',
            priorityEnum: ticket.priorityEnum,
            severityEnum: ticket.severityEnum || TicketSeverityEnum.LOW,
            ticketStatus: ticket.ticketStatus,
            ticketCode: ticket.ticketCode,

            department: ticket.department || '',
            contactNumber: ticket.contactNumber || '',
            location: ticket.location || '',

            assignedGroup: ticket.assignedGroup || '',
            assignedTo: ticket.assignAdminId ? String(ticket.assignAdminId) : '',
            assignAdminId: ticket.assignAdminId ? String(ticket.assignAdminId) : '',

            slaType: ticket.slaType || '',
            responseDueTime: ticket.responseDueTime ? new Date(ticket.responseDueTime).toISOString().slice(0, 16) : '',
            escalationLevel: ticket.escalationLevel || 0,
            timeSpentMinutes: ticket.timeSpentMinutes || 0,

            rootCause: ticket.rootCause || '',
            resolutionSummary: ticket.resolutionSummary || '',
            closureRemarks: ticket.closureRemarks || '',

            userRating: ticket.userRating || 0,
            userFeedback: ticket.userFeedback || '',

            adminComments: ticket.adminComments || '',
            userComments: ticket.userComments || '',
            internalNotes: ticket.internalNotes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = (ticket: any) => {
        setTicketToDelete(ticket);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!ticketToDelete) return;
        setIsLoading(true);
        try {
            const req = new DeleteTicketModel(ticketToDelete.id);
            const response = await ticketService.deleteTicket(req);
            if (response.status) {
                AlertMessages.getSuccessMessage(response.message || 'Ticket deleted successfully');
                fetchTickets();
            } else {
                AlertMessages.getErrorMessage(response.message || 'Delete failed');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
            setDeleteConfirmOpen(false);
            setTicketToDelete(null);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTicket(null);
        setFormData({
            subject: '',
            description: '',
            categoryEnum: TicketCategoryEnum.OTHER,
            subCategory: '',
            priorityEnum: TicketPriorityEnum.MEDIUM,
            severityEnum: TicketSeverityEnum.LOW,
            ticketStatus: TicketStatusEnum.OPEN,
            ticketCode: '',
            department: '',
            contactNumber: '',
            location: '',
            assignedGroup: '',
            assignedTo: '',
            slaType: '',
            responseDueTime: '',
            escalationLevel: 0,
            timeSpentMinutes: 0,
            rootCause: '',
            resolutionSummary: '',
            closureRemarks: '',
            userRating: 0,
            userFeedback: '',
            adminComments: '',
            userComments: '',
            internalNotes: '',
            assignAdminId: ''
        });
    };

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const statusCounts = {
        all: tickets.length,
        open: tickets.filter(t => t.ticketStatus === TicketStatusEnum.OPEN).length,
        in_progress: tickets.filter(t => t.ticketStatus === TicketStatusEnum.IN_PROGRESS).length,
        resolved: tickets.filter(t => t.ticketStatus === TicketStatusEnum.RESOLVED).length,
        closed: tickets.filter(t => t.ticketStatus === TicketStatusEnum.CLOSED).length,
    };



    const getSLAStatus = (deadline?: string, status?: TicketStatusEnum) => {
        if (!deadline) return null;
        if (status === TicketStatusEnum.RESOLVED || status === TicketStatusEnum.CLOSED) return { label: 'SLA MET', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' };

        const now = new Date();
        const due = new Date(deadline);
        const diffMs = due.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffMs < 0) return { label: 'OVERDUE', color: 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400' };
        if (diffHours < 4) return { label: 'DUE SOON', color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400' };
        return { label: `Due in ${Math.round(diffHours)}h`, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' };
    };

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.USER]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 space-y-8">
                <PageHeader
                    icon={<Ticket />}
                    title="Support Tickets"
                    description="Manage all support requests"
                    gradient="from-indigo-500 to-purple-600"
                >
                    <div className="flex items-center gap-3 w-full">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Create Ticket button hidden as per request */}
                        {/* <Button
                            variant="primary"
                            onClick={() => router.push('/create-ticket')}
                            leftIcon={<Plus className="h-4 w-4" />}
                            className="whitespace-nowrap shadow-lg shadow-indigo-500/20"
                        >
                            Create Ticket
                        </Button> */}

                        {isSuperAdmin && (
                            <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <button
                                    onClick={() => setViewMode('all')}
                                    className={`flex items-center gap-1.5 px-4 py-1 rounded-lg font-bold text-xs transition-all ${viewMode === 'all'
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    All
                                </button>
                                <button
                                    onClick={() => setViewMode('my')}
                                    className={`flex items-center gap-1.5 px-4 py-1 rounded-lg font-bold text-xs transition-all ${viewMode === 'my'
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <User className="h-3.5 w-3.5" />
                                    My
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold transition-all shadow-sm border ${showFilters
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            <span>Filters</span>
                        </button>
                    </div>
                </PageHeader>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow font-medium"
                            >
                                <option value="all">All Categories</option>
                                {Object.values(TicketCategoryEnum).map((cat) => (
                                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow font-medium"
                            >
                                <option value="all">All Statuses</option>
                                {Object.values(TicketStatusEnum).map((status) => (
                                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow font-medium"
                            >
                                <option value="all">All Priorities</option>
                                {Object.values(TicketPriorityEnum).map((prio) => (
                                    <option key={prio} value={prio}>{prio.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setCategoryFilter('all');
                                    setPriorityFilter('all');
                                    setStatusFilter('all');
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        title="All Tickets"
                        value={statusCounts.all}
                        icon={Ticket}
                        gradient="from-indigo-500 to-violet-600"
                        iconBg="bg-indigo-50 dark:bg-indigo-900/20"
                        iconColor="text-indigo-600 dark:text-indigo-400"
                        isLoading={false}
                    />
                    <StatCard
                        title="Open"
                        value={statusCounts.open}
                        icon={AlertTriangle}
                        gradient="from-blue-500 to-cyan-600"
                        iconBg="bg-blue-50 dark:bg-blue-900/20"
                        iconColor="text-blue-600 dark:text-blue-400"
                        isLoading={false}
                    />
                    <StatCard
                        title="In Progress"
                        value={statusCounts.in_progress}
                        icon={Clock}
                        gradient="from-amber-500 to-orange-600"
                        iconBg="bg-amber-50 dark:bg-amber-900/20"
                        iconColor="text-amber-600 dark:text-amber-400"
                        isLoading={false}
                    />
                    <StatCard
                        title="Resolved"
                        value={statusCounts.resolved}
                        icon={CheckCircle}
                        gradient="from-emerald-500 to-teal-600"
                        iconBg="bg-emerald-50 dark:bg-emerald-900/20"
                        iconColor="text-emerald-600 dark:text-emerald-400"
                        isLoading={false}
                    />
                    <StatCard
                        title="Closed"
                        value={statusCounts.closed}
                        icon={Lock}
                        gradient="from-slate-500 to-gray-600"
                        iconBg="bg-slate-50 dark:bg-slate-800"
                        iconColor="text-slate-600 dark:text-slate-400"
                        isLoading={false}
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse border border-slate-200 dark:border-slate-700">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Ticket Code</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Subject</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Category</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Status</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Priority</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Requester</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Date</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                                                <Ticket className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Tickets Found</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Try adjusting your filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((ticket) => {
                                        const Config = CategoryConfig[ticket.categoryEnum] || CategoryConfig[TicketCategoryEnum.OTHER];
                                        const CategoryIcon = Config.icon;

                                        return (
                                            <tr key={ticket.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                            {ticket.ticketCode}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="max-w-[300px] mx-auto">
                                                        <div className="font-bold text-slate-900 dark:text-white truncate mb-0.5" title={ticket.subject}>
                                                            {ticket.subject}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${Config.gradient} text-white shadow-sm`}>
                                                            <CategoryIcon className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            {ticket.categoryEnum.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${ticket.ticketStatus === TicketStatusEnum.OPEN ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                                                        ticket.ticketStatus === TicketStatusEnum.IN_PROGRESS ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' :
                                                            ticket.ticketStatus === TicketStatusEnum.RESOLVED ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' :
                                                                'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                                        }`}>
                                                        {ticket.ticketStatus.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider ${ticket.priorityEnum === TicketPriorityEnum.URGENT ? 'text-rose-600 dark:text-rose-400' :
                                                        ticket.priorityEnum === TicketPriorityEnum.HIGH ? 'text-orange-600 dark:text-orange-400' :
                                                            'text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                        {(ticket.priorityEnum === TicketPriorityEnum.URGENT || ticket.priorityEnum === TicketPriorityEnum.HIGH) && (
                                                            <AlertTriangle className="h-3.5 w-3.5" />
                                                        )}
                                                        {ticket.priorityEnum}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    {ticket.employeeName ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={`w-6 h-6 rounded bg-gradient-to-br ${Config.gradient} flex items-center justify-center text-white text-[10px] font-black`}>
                                                                {ticket.employeeName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{ticket.employeeName}</span>
                                                                <span className="text-[10px] text-slate-400 leading-tight">{ticket.employeeEmail}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {formatDate(ticket.createdAt)}
                                                        </div>
                                                        {getSLAStatus(ticket.slaDeadline, ticket.ticketStatus) && (
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getSLAStatus(ticket.slaDeadline, ticket.ticketStatus)?.color}`}>
                                                                {getSLAStatus(ticket.slaDeadline, ticket.ticketStatus)?.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="flex items-center justify-center gap-1 opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => router.push(`/support?ticketId=${ticket.id}&ticketTitle=${encodeURIComponent(ticket.subject)}`)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                            title="Chat & Details"
                                                        >
                                                            <MessageSquare className="h-4 w-4" />
                                                        </button>

                                                        {isAdmin && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(ticket)}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                                    title="Edit Ticket"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(ticket)}
                                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                                                    title="Delete Ticket"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingTicket ? "Manage Ticket" : "Create New Ticket"}
                    size="2xl"
                    footer={
                        <>
                            <Button variant="outline" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
                                {editingTicket ? 'Update Ticket' : 'Create Ticket'}
                            </Button>
                        </>
                    }
                >
                    <div className="flex flex-col h-full max-h-[70vh]">

                        {/* Tabs Content */}
                        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">

                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Core Info Section */}
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Subject</label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            disabled={!!editingTicket}
                                            placeholder="Brief summary of the issue"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium min-h-[120px] resize-y disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            disabled={!!editingTicket}
                                            placeholder="Provide as much detail as possible..."
                                        />
                                    </div>

                                    {/* Classification Section */}
                                    <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Classification & Priority</h4>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Category</label>
                                        <select
                                            value={formData.categoryEnum}
                                            onChange={(e) => setFormData({ ...formData, categoryEnum: e.target.value as TicketCategoryEnum })}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            disabled={!!editingTicket}
                                        >
                                            {Object.values(TicketCategoryEnum).map((cat) => (
                                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Sub-Category</label>
                                        <input
                                            type="text"
                                            value={formData.subCategory}
                                            onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            disabled={!!editingTicket}
                                            placeholder="e.g. Printer, Software"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Priority</label>
                                        <select
                                            value={formData.priorityEnum}
                                            onChange={(e) => setFormData({ ...formData, priorityEnum: e.target.value as TicketPriorityEnum })}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            disabled={!!editingTicket}
                                        >
                                            {Object.values(TicketPriorityEnum).map((prio) => (
                                                <option key={prio} value={prio}>{prio.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Severity</label>
                                        <select
                                            value={formData.severityEnum}
                                            onChange={(e) => setFormData({ ...formData, severityEnum: e.target.value as TicketSeverityEnum })}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            disabled={!!editingTicket}
                                        >
                                            {Object.values(TicketSeverityEnum).map((sev) => (
                                                <option key={sev} value={sev}>{sev.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Requester Info Section */}
                                    <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Requester & Assignment</h4>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Department</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            disabled={!!editingTicket}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            disabled={!!editingTicket}
                                            placeholder="Workstation, Floor, etc."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Contact Number</label>
                                        <input
                                            type="text"
                                            value={formData.contactNumber}
                                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                                            disabled={!!editingTicket}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Status</label>
                                        <select
                                            value={formData.ticketStatus}
                                            onChange={(e) => setFormData({ ...formData, ticketStatus: e.target.value as TicketStatusEnum })}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                        >
                                            {Object.values(TicketStatusEnum).map((status) => (
                                                <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Assign To Admin</label>
                                        <select
                                            value={formData.assignAdminId}
                                            onChange={(e) => setFormData({ ...formData, assignAdminId: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                        >
                                            <option value="">Select Admin</option>
                                            {admins.map((admin) => (
                                                <option key={admin.id} value={admin.id}>{admin.fullName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Internal Remarks / Notes</label>
                                        <textarea
                                            value={formData.adminComments}
                                            onChange={(e) => setFormData({ ...formData, adminComments: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium min-h-[100px] resize-y"
                                            placeholder="Internal notes for support team..."
                                        />
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>
                </Modal>

                <DeleteConfirmDialog
                    isOpen={deleteConfirmOpen}
                    onClose={() => setDeleteConfirmOpen(false)}
                    onConfirm={confirmDelete}
                    itemName="Ticket"
                    message={ticketToDelete ? `Are you sure you want to delete ticket "${ticketToDelete.subject}"?` : undefined}
                    isDeleting={isLoading}
                />
            </div>
        </RouteGuard >
    );
}

export default TicketsPage;