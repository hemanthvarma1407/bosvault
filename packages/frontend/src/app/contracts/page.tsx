'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { contractsService, vendorService } from '@/lib/api/services';
import {
    ContractStatusEnum,
    CreateContractModel,
    UpdateContractModel,
    IdRequestModel,
    Vendor
} from '@bosvault/shared-models';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    Plus, Library, Trash2, Pencil, Search,
    Store, AlertTriangle, CheckCircle2, FileText,
    Clock
} from 'lucide-react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { ModernTabs } from '../assets/components/ModernTabs';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { UserRoleEnum } from '@bosvault/shared-models';

export default function ContractsPage() {
    const { } = useAuth();
    const [contracts, setContracts] = useState<any[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editContract, setEditContract] = useState<any | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [isLoading, setIsLoading] = useState(false);

    const fetchContracts = useCallback(async () => {
        try {
            setIsLoading(true);
            const response: any = await contractsService.getAllContracts();
            if (response.status) {
                setContracts(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchVendors = useCallback(async () => {
        try {
            const response: any = await vendorService.getAllVendors();
            if (response.status) {
                setVendors(response.vendors || []);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    }, []);

    useEffect(() => {
        fetchContracts();
        fetchVendors();
    }, [fetchContracts, fetchVendors]);

    const filteredContracts = useMemo(() => {
        return contracts.filter(contract => {
            const matchesSearch =
                contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contract.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contract.description?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (activeTab === 'expiring') {
                const days = getDaysRemaining(contract.endDate);
                return days !== null && days <= 30 && days >= 0;
            }

            if (activeTab === 'expired') {
                const days = getDaysRemaining(contract.endDate);
                return days !== null && days < 0;
            }

            return contract.status === ContractStatusEnum.ACTIVE;
        });
    }, [contracts, searchQuery, activeTab]);

    const getDaysRemaining = (dateString: string) => {
        if (!dateString) return null;
        const end = new Date(dateString);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const handleDeleteClick = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        try {
            const response: any = await contractsService.deleteContract(new IdRequestModel(deletingId));
            if (response.status) {
                AlertMessages.getSuccessMessage('Contract deleted successfully');
                fetchContracts();
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to delete contract');
            }
        } catch (error) {
            AlertMessages.getErrorMessage('An error occurred');
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
        }
    };

    const tabs = [
        { id: 'active', label: 'Active Contracts', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
        { id: 'expiring', label: 'Expiring Soon', icon: Clock, gradient: 'from-amber-500 to-orange-500' },
        { id: 'expired', label: 'Expired', icon: AlertTriangle, gradient: 'from-rose-500 to-pink-500' }
    ];

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN, UserRoleEnum.SITE_ADMIN]}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 p-4 lg:p-8 space-y-8">
                <PageHeader
                    title="Contract Management"
                    description="Monitor vendor agreements, renewals, and compliance"
                    icon={<Library />}
                    gradient="from-slate-900 to-violet-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-900 dark:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search contracts..."
                                className="pl-9 pr-3 py-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => { setEditContract(null); setIsModalOpen(true); }}
                            className="bg-slate-900 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            New Contract
                        </button>
                    </div>
                </PageHeader>

                <div className="space-y-6">
                    <ModernTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    <div className="grid grid-cols-1 gap-4">
                        {isLoading ? (
                            <div className="py-24 text-center">
                                <div className="animate-spin h-8 w-8 border-4 border-slate-700 border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed">Syncing your contracts hub...</p>
                            </div>
                        ) : filteredContracts.length === 0 ? (
                            <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center gap-4">
                                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-full">
                                    <Library className="h-10 w-10 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black uppercase tracking-widest text-slate-900 dark:text-white">No contracts found</p>
                                    <p className="text-xs text-slate-500 font-medium">Clear your search or add a new contract to get started.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredContracts.map((contract) => {
                                    const daysLeft = getDaysRemaining(contract.endDate);
                                    const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
                                    const isExpired = daysLeft !== null && daysLeft < 0;

                                    return (
                                        <div
                                            key={contract.id}
                                            className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <FileText className="w-24 h-24 text-slate-900 dark:text-white rotate-12" />
                                            </div>

                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white mb-1">{contract.contractNumber}</h3>
                                                        <div className="flex items-center gap-1.5">
                                                            <Store className="w-3 h-3 text-slate-900 dark:text-white" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{contract.vendor?.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${isExpired ? 'bg-rose-50 text-rose-600 text-rose-400' :
                                                        isExpiring ? 'bg-amber-50 text-amber-600' :
                                                            'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                        {isExpired ? 'Expired' : isExpiring ? 'Expiring' : 'Active'}
                                                    </span>
                                                </div>

                                                <div className="space-y-4 flex-1">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200 dark:border-white/5">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] font-bold text-slate-900 dark:text-white">{contract.currency}</span>
                                                                <p className="text-lg font-black text-slate-900 dark:text-white">{Number(contract.totalValue).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200 dark:border-white/5">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Left</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : isExpiring ? 'text-amber-500' : 'text-emerald-500'}`} />
                                                                <p className="text-lg font-black text-slate-900 dark:text-white">{isExpired ? '---' : daysLeft}</p>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Days</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between px-1">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">End Date</span>
                                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white">{new Date(contract.endDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => { setEditContract(contract); setIsModalOpen(true); }}
                                                                className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:bg-indigo-900/20 transition-all"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(contract.id)}
                                                                className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <DeleteConfirmDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    itemName="Contract"
                />

                {isModalOpen && (
                    <ContractModal
                        isOpen={isModalOpen}
                        onClose={() => { setIsModalOpen(false); setEditContract(null); }}
                        editContract={editContract}
                        vendors={vendors}
                        onSuccess={() => { setIsModalOpen(false); fetchContracts(); }}
                    />
                )}
            </div>
        </RouteGuard>
    );
}

function ContractModal({ isOpen, onClose, editContract, vendors, onSuccess }: any) {
    const [formData, setFormData] = useState({
        vendorId: '',
        contractNumber: '',
        startDate: '',
        endDate: '',
        totalValue: '',
        currency: 'USD',
        description: '',
        terms: '',
        renewalAlertDays: '30',
        status: ContractStatusEnum.ACTIVE
    });

    useEffect(() => {
        if (editContract) {
            setFormData({
                vendorId: editContract.vendorId.toString(),
                contractNumber: editContract.contractNumber,
                startDate: new Date(editContract.startDate).toISOString().split('T')[0],
                endDate: new Date(editContract.endDate).toISOString().split('T')[0],
                totalValue: editContract.totalValue.toString(),
                currency: editContract.currency,
                description: editContract.description || '',
                terms: editContract.terms || '',
                renewalAlertDays: editContract.renewalAlertDays.toString(),
                status: editContract.status
            });
        }
    }, [editContract]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data: any = {
                ...formData,
                vendorId: Number(formData.vendorId),
                totalValue: Number(formData.totalValue),
                renewalAlertDays: Number(formData.renewalAlertDays),
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate)
            };

            let response: any;
            if (editContract) {
                const updateModel = new UpdateContractModel(
                    editContract.id,
                    data.vendorId,
                    data.contractNumber,
                    data.startDate,
                    data.endDate,
                    data.totalValue,
                    data.currency,
                    data.renewalAlertDays,
                    data.status,
                    data.description,
                    data.terms
                );
                response = await contractsService.updateContract(updateModel);
            } else {
                const createModel = new CreateContractModel(
                    data.vendorId,
                    data.contractNumber,
                    data.startDate,
                    data.endDate,
                    data.totalValue,
                    data.currency,
                    data.renewalAlertDays,
                    data.status,
                    data.description,
                    data.terms
                );
                response = await contractsService.createContract(createModel);
            }

            if (response.status) {
                AlertMessages.getSuccessMessage(editContract ? 'Contract updated' : 'Contract created');
                onSuccess();
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error) {
            AlertMessages.getErrorMessage('An error occurred');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editContract ? "Edit Agreement" : "New Agreement"}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vendor Partner</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all"
                            value={formData.vendorId}
                            onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                            required
                        >
                            <option value="">Select Vendor</option>
                            {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Agreement #</label>
                        <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all"
                            placeholder="e.g. CON-2024-001"
                            value={formData.contractNumber}
                            onChange={e => setFormData({ ...formData, contractNumber: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Effective Date</label>
                        <input
                            type="date"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all font-bold"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Termination Date</label>
                        <input
                            type="date"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all font-bold"
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contract Value</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                            <input
                                type="number"
                                className="w-full pl-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all"
                                placeholder="0.00"
                                value={formData.totalValue}
                                onChange={e => setFormData({ ...formData, totalValue: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Renewal Buffer</label>
                        <div className="relative group">
                            <input
                                type="number"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all"
                                value={formData.renewalAlertDays}
                                onChange={e => setFormData({ ...formData, renewalAlertDays: e.target.value })}
                                required
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase">Days</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lifecycle Status</label>
                        <select
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        >
                            <option value={ContractStatusEnum.ACTIVE}>Active</option>
                            <option value={ContractStatusEnum.PENDING_RENEWAL}>Renewal Pending</option>
                            <option value={ContractStatusEnum.TERMINATED}>Terminated</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Strategic Overview</label>
                    <textarea
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] p-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-slate-700 transition-all resize-none"
                        placeholder="Key highlights, deliverables, and service levels..."
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        {editContract ? 'Update Agreement' : 'Finalize Agreement'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
