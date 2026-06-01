'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ticketService, authService, departmentService } from '@/lib/api/services';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { Button } from '@/components/ui/Button';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
    IdRequestModel, TicketCategoryEnum, TicketPriorityEnum,
    TicketStatusEnum, CreateTicketModel, UpdateTicketModel, DeleteTicketModel
} from '@bosvault/shared-models';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { apiClient } from '@/lib/api-client';
import {
    Ticket, Plus, Search, Monitor, Cpu, Wifi, Mail, Lock, HelpCircle,
    MessageSquare, Edit, Trash2, Clock, UploadCloud, Paperclip, Image, FileText, RefreshCw
} from 'lucide-react';

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
    employeeId?: number;
    employeeName?: string;
    employeeEmail?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    slaDeadline?: string | Date;
    timeSpentMinutes?: number;
    assignAdminId?: number;
    subCategory?: string;
    department?: string;
    contactNumber?: string;
    location?: string;
}

interface AttachedFile {
    id?: string;
    name: string;
    size: string;
    type: string;
    preview?: string;
    status?: 'uploading' | 'success' | 'error';
    url?: string;
    fileName?: string;
}

const SupportHubPage: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [admins, setAdmins] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState<TicketData | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    
    // Attachments State
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        categoryEnum: TicketCategoryEnum.OTHER,
        priorityEnum: TicketPriorityEnum.MEDIUM,
        subCategory: '',
        department: '',
        contactNumber: '',
        location: '',
        assignAdminId: ''
    });

    const fetchTickets = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await ticketService.getMyTickets();
            if (response.status && response.tickets) {
                setTickets(response.tickets);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setIsLoading(false);
        }
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

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        fetchTickets();
        fetchAdmins();
        fetchDepartments();
    }, [fetchTickets, fetchAdmins, fetchDepartments]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreate = () => {
        setEditingTicket(null);
        setAttachedFiles([]);
        setFormData({
            subject: '',
            description: '',
            categoryEnum: TicketCategoryEnum.OTHER,
            priorityEnum: TicketPriorityEnum.MEDIUM,
            subCategory: '',
            department: '',
            contactNumber: '',
            location: '',
            assignAdminId: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (ticket: TicketData) => {
        setEditingTicket(ticket);
        setFormData({
            subject: ticket.subject,
            description: ticket.description || '',
            categoryEnum: ticket.categoryEnum,
            priorityEnum: ticket.priorityEnum,
            subCategory: ticket.subCategory || '',
            department: ticket.department || '',
            contactNumber: ticket.contactNumber || '',
            location: ticket.location || '',
            assignAdminId: ticket.assignAdminId ? String(ticket.assignAdminId) : ''
        });
        
        // Load attachments if present
        const stored = localStorage.getItem(`ticket_attachments_${ticket.ticketCode}`);
        if (stored) {
            try {
                setAttachedFiles(JSON.parse(stored));
            } catch (e) {
                setAttachedFiles([]);
            }
        } else {
            setAttachedFiles([]);
        }
        
        setIsModalOpen(true);
    };

    const handleDelete = (ticket: TicketData) => {
        setTicketToDelete(ticket);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!ticketToDelete) return;
        setIsSubmitting(true);
        try {
            const response = await ticketService.deleteTicket(new DeleteTicketModel(ticketToDelete.id));
            if (response.status) {
                localStorage.removeItem(`ticket_attachments_${ticketToDelete.ticketCode}`);
                AlertMessages.getSuccessMessage('Ticket deleted successfully');
                setDeleteConfirmOpen(false);
                fetchTickets();
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to delete ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesToUpload = Array.from(e.target.files);
        
        for (const file of filesToUpload) {
            const tempId = Math.random().toString(36).substring(7);
            const newFileEntry: AttachedFile = {
                id: tempId,
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                type: file.type,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                status: 'uploading'
            };
            
            setAttachedFiles(prev => [...prev, newFileEntry]);
            
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                
                const response = await apiClient.post('/tickets/upload-attachment', uploadFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                if (response.data && response.data.status) {
                    const uploadedData = response.data.data;
                    setAttachedFiles(prev => prev.map(f => f.id === tempId ? {
                        ...f,
                        status: 'success',
                        url: uploadedData.url,
                        fileName: uploadedData.fileName
                    } : f));
                } else {
                    throw new Error("Upload failed");
                }
            } catch (error) {
                console.error("Failed to upload file:", error);
                setAttachedFiles(prev => prev.map(f => f.id === tempId ? {
                    ...f,
                    status: 'error'
                } : f));
                AlertMessages.getErrorMessage(`Failed to upload ${file.name}`);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent submission if still uploading files
        const stillUploading = attachedFiles.some(f => f.status === 'uploading');
        if (stillUploading) {
            AlertMessages.getErrorMessage("Please wait for files to complete uploading before submitting.");
            return;
        }

        setIsSubmitting(true);
        
        // Format description with successfully uploaded backend attachment links
        let finalDescription = formData.description;
        const activeAttachments = attachedFiles.filter(f => f.status === 'success' || f.url);
        if (activeAttachments.length > 0) {
            const attachmentLinks = activeAttachments
                .map(f => `- [${f.name}](${configVariables.APP_AVS_SERVICE_URL}${f.url})`)
                .join('\n');
            if (attachmentLinks) {
                finalDescription += `\n\n**Attachments:**\n${attachmentLinks}`;
            }
        }

        try {
            if (editingTicket) {
                const model = new UpdateTicketModel(
                    editingTicket.id, // 1
                    editingTicket.ticketCode, // 2
                    formData.categoryEnum, // 3
                    formData.priorityEnum, // 4
                    formData.subject, // 5
                    editingTicket.ticketStatus, // 6
                    editingTicket.employeeId, // 7
                    formData.assignAdminId ? Number(formData.assignAdminId) : undefined, // 8
                    undefined, // 9: expectedCompletionDate
                    undefined, // 10: resolvedAt
                    undefined, // 11: timeSpentMinutes
                    finalDescription, // 12
                    formData.subCategory, // 13
                    undefined, // 14: severityEnum
                    formData.department, // 15
                    formData.contactNumber, // 16
                    formData.location, // 17
                    undefined, // 18: contactEmail
                    undefined, // 19: assignedGroup
                    undefined, // 20: slaType
                    undefined, // 21: responseDueTime
                );
                const response = await ticketService.updateTicket(model);
                if (response.status) {
                    if (attachedFiles.length > 0) {
                        localStorage.setItem(`ticket_attachments_${editingTicket.ticketCode}`, JSON.stringify(attachedFiles));
                    } else {
                        localStorage.removeItem(`ticket_attachments_${editingTicket.ticketCode}`);
                    }
                    AlertMessages.getSuccessMessage('Ticket updated successfully');
                    setIsModalOpen(false);
                    fetchTickets();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateTicketModel(
                    '', // 1
                    formData.categoryEnum, // 2
                    formData.priorityEnum, // 3
                    formData.subject, // 4
                    TicketStatusEnum.OPEN, // 5
                    user?.id, // 6
                    formData.assignAdminId ? Number(formData.assignAdminId) : undefined, // 7
                    undefined, // 8: expectedCompletionDate
                    undefined, // 9: resolvedAt
                    undefined, // 10: timeSpentMinutes
                    finalDescription, // 11
                    formData.subCategory, // 12
                    undefined, // 13: severityEnum
                    formData.department, // 14
                    formData.contactNumber, // 15
                    formData.location, // 16
                );

                const response = await ticketService.createTicket(model);
                if (response.status) {
                    const ticketCode = (response as any).ticketCode || (response as any).ticket?.ticketCode || 'TKT-TEMP';
                    if (attachedFiles.length > 0) {
                        localStorage.setItem(`ticket_attachments_${ticketCode}`, JSON.stringify(attachedFiles));
                    }
                    AlertMessages.getSuccessMessage('Ticket created successfully');
                    setIsModalOpen(false);
                    fetchTickets();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to process ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.ticketCode?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Get configVariables from shared-services package safely
    const configVariables = require('@bosvault/shared-services').configVariables;

    return (
        <RouteGuard>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 space-y-8">
                <PageHeader
                    icon={<Ticket />}
                    title={`Support Hub`}
                    gradient="from-indigo-500 to-purple-600"
                >
                    <div className="flex items-center gap-3 w-full">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            leftIcon={<Plus className="h-4 w-4" />}
                            className="whitespace-nowrap shadow-lg shadow-indigo-500/20"
                        >
                            Create New Ticket
                        </Button>
                    </div>
                </PageHeader>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse border border-slate-200 dark:border-slate-700">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Code</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Subject</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Category</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Status</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Assigned To</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Priority</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center">Date</th>
                                    <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center border border-slate-200 dark:border-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-500">Loading your tickets...</td>
                                    </tr>
                                ) : filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                                                <Ticket className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Tickets Found</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">You haven't submitted any support requests yet.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((ticket) => {
                                        const Config = CategoryConfig[ticket.categoryEnum] || CategoryConfig[TicketCategoryEnum.OTHER];
                                        const CategoryIcon = Config.icon;
                                        const hasAttachments = typeof window !== 'undefined' && localStorage.getItem(`ticket_attachments_${ticket.ticketCode}`);

                                        return (
                                            <tr key={ticket.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                        {ticket.ticketCode}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="font-bold text-slate-900 dark:text-white truncate max-w-[300px] mx-auto flex items-center justify-center gap-1.5" title={ticket.subject}>
                                                        {ticket.subject}
                                                        {hasAttachments && (
                                                            <span title="Attachments included" className="shrink-0">
                                                                <Paperclip className="h-3.5 w-3.5 text-indigo-550" />
                                                            </span>
                                                        )}
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
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center text-sm text-slate-600 dark:text-slate-300 font-bold">
                                                    {ticket.assignAdminId ? (
                                                        admins.length > 0 ? (
                                                            admins.find(a => a.id === ticket.assignAdminId)?.fullName || 'Admin'
                                                        ) : 'Loading...'
                                                    ) : 'Unassigned'}
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider ${ticket.priorityEnum === TicketPriorityEnum.URGENT ? 'text-rose-600 dark:text-rose-400' :
                                                        ticket.priorityEnum === TicketPriorityEnum.HIGH ? 'text-orange-600 dark:text-orange-400' :
                                                            'text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                        {ticket.priorityEnum}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 border border-slate-200 dark:border-slate-700 text-center">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {formatDate(ticket.createdAt)}
                                                        </div>
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
                    onClose={() => setIsModalOpen(false)}
                    title={editingTicket ? "Edit Support Request" : "Submit Support Request"}
                    size="xl"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                />
                                <Select
                                    label="Priority"
                                    name="priorityEnum"
                                    value={formData.priorityEnum}
                                    onChange={handleChange}
                                    options={Object.values(TicketPriorityEnum).map(p => ({ value: p, label: p.toUpperCase() }))}
                                />
                            </div>

                            <TextArea
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                            />

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Monitor className="h-3 w-3" />
                                    Classification
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 text-center">Category</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-500 text-center"
                                            value={formData.categoryEnum}
                                            onChange={(e) => {
                                                const newCategory = e.target.value as TicketCategoryEnum;
                                                setFormData({
                                                    ...formData,
                                                    categoryEnum: newCategory,
                                                    subCategory: SUB_CATEGORY_MAP[newCategory] ? SUB_CATEGORY_MAP[newCategory][0] : 'other'
                                                });
                                            }}
                                            disabled={!!editingTicket}
                                        >
                                            {Object.values(TicketCategoryEnum).map((cat) => (
                                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 text-center">Sub-Category</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-500 text-center"
                                            value={formData.subCategory}
                                            onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                            disabled={!!editingTicket}
                                        >
                                            {(SUB_CATEGORY_MAP[formData.categoryEnum] || ['other']).map((sub) => (
                                                <option key={sub} value={sub}>{sub.replace(/_/g, ' ').toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 text-center">Department</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-500 text-center"
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
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    Contact & Location
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Input
                                        label="Contact Number"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                    />
                                    <Input
                                        label="Location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                    />
                                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'SUPPORT_ADMIN' || user?.role === 'MANAGER') && (
                                        <Select
                                            label="Assign To"
                                            name="assignAdminId"
                                            value={formData.assignAdminId}
                                            onChange={handleChange}
                                            options={[
                                                { value: '', label: 'Auto' },
                                                ...admins.map(admin => ({
                                                    value: String(admin.id),
                                                    label: admin.fullName
                                                }))
                                            ]}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Screenshots & Attachments Dropzone */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Paperclip className="h-3 w-3" />
                                    Screenshots & File Attachments
                                </h4>
                                
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-all relative group bg-white dark:bg-slate-950">
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                                            <UploadCloud className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-slate-850 dark:text-slate-200 block">Drag & Drop Screenshots or Files</span>
                                            <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-0.5">Supports PDF, DOCX, PNG, JPG, XLS up to 10MB</span>
                                        </div>
                                    </div>
                                </div>

                                {attachedFiles.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 mt-3">
                                        {attachedFiles.map((file, idx) => {
                                            const FileIcon = file.type.startsWith('image/') ? Image : FileText;
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {file.preview ? (
                                                            <img src={file.preview} alt="preview" className="h-9 w-9 object-cover rounded-lg border border-slate-100" />
                                                        ) : (
                                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                                <FileIcon className="h-4.5 w-4.5" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <span className="font-extrabold text-slate-850 dark:text-slate-200 block truncate" title={file.name}>{file.name}</span>
                                                            {file.status === 'uploading' ? (
                                                                <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold">
                                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                                    <span>Uploading to backend...</span>
                                                                </div>
                                                            ) : file.status === 'error' ? (
                                                                <span className="text-[10px] text-rose-500 font-bold block">Upload Failed</span>
                                                            ) : (
                                                                <span className="text-[10px] text-emerald-500 font-bold block">{file.size} • Saved on Backend</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                                                        disabled={isSubmitting}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isSubmitting}
                                leftIcon={<Ticket className="h-4 w-4" />}
                            >
                                {editingTicket ? 'Update Request' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                <DeleteConfirmDialog
                    isOpen={deleteConfirmOpen}
                    onClose={() => setDeleteConfirmOpen(false)}
                    onConfirm={confirmDelete}
                    itemName="Ticket"
                    message={ticketToDelete ? `Are you sure you want to delete ticket "${ticketToDelete.subject}"?` : undefined}
                    isDeleting={isSubmitting}
                />
            </div>
        </RouteGuard>
    );
};

export default SupportHubPage;