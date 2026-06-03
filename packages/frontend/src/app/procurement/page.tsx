'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { procurementService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShoppingCart, Plus, Search, Calendar, User, Building, DollarSign, FileText, AlertCircle, CheckCircle2, XCircle, Filter, Eye, Pen, FileUp, ExternalLink, Trash2 } from 'lucide-react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum, POStatusEnum, UpdatePOStatusRequestModel, PurchaseOrderModel } from '@bosvault/shared-models';
import { useAuth } from '@/contexts/AuthContext';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { CreatePOModal } from './components/CreatePOModal';

const ProcurementPage: React.FC = () => {
    const { user } = useAuth();
    const [pos, setPos] = useState<PurchaseOrderModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<any | null>(null);
    const [editPO, setEditPO] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'OPEN' | 'APPROVED' | 'REJECTED'>('OPEN');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived Metrics
    const totalPOs = pos.length;
    const totalSpend = pos.reduce((sum, po) => sum + (po.status === POStatusEnum.APPROVED || po.status === POStatusEnum.ORDERED || po.status === POStatusEnum.RECEIVED ? (Number(po.totalAmount) || 0) : 0), 0);
    const activeVendors = new Set(pos.map(po => po.vendorId)).size;

    const filteredPOs = pos.filter(po => {
        const query = searchQuery.toLowerCase();
        const poNumber = po.poNumber?.toLowerCase() || '';
        const vendorName = po.vendorName?.toLowerCase() || '';

        const matchesSearch = poNumber.includes(query) || vendorName.includes(query);
        const matchesStatusDropdown = statusFilter === 'ALL' || po.status === statusFilter;

        let matchesTab = false;
        if (activeTab === 'OPEN') {
            matchesTab = [POStatusEnum.DRAFT, POStatusEnum.ORDERED, POStatusEnum.PARTIALLY_RECEIVED].includes(po.status);
        } else if (activeTab === 'APPROVED') {
            matchesTab = po.status === POStatusEnum.APPROVED;
        } else if (activeTab === 'REJECTED') {
            matchesTab = po.status === POStatusEnum.REJECTED;
        }

        return matchesSearch && matchesStatusDropdown && matchesTab;
    });

    const fetchPOs = useCallback(async () => {
        if (!user?.companyId) return;
        setIsLoading(true);
        try {
            const response = await procurementService.getAllPurchaseOrders();
            if (response.status) {
                setPos(response.pos || []);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to fetch Purchase Orders');
        } finally {
            setIsLoading(false);
        }
    }, [user?.companyId]);

    const handleDeletePO = async (poId: number) => {
        if (!window.confirm('Are you sure you want to delete this Purchase Order? This action cannot be undone.')) return;

        try {
            const response = await procurementService.deletePurchaseOrder(poId);
            if (response.status) {
                AlertMessages.getSuccessMessage('Purchase Order deleted successfully');
                fetchPOs();
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to delete Purchase Order');
        }
    };

    const handleStatusUpdate = async (poId: number, status: POStatusEnum) => {
        try {
            const response = await procurementService.updatePOStatus(new UpdatePOStatusRequestModel(poId, status));
            if (response.status) {
                AlertMessages.getSuccessMessage(`Purchase Order ${status.toLowerCase()} successfully`);
                fetchPOs();
                setSelectedPO(null);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to update status');
        }
    };

    const handleInvoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedPO || !user) return;

        setIsUploading(true);
        try {
            // In a real app, we would upload to S3/Cloudinary here
            // For this demo, we'll simulate an upload and use a mock URL
            // and update the PO with this URL

            // Simulating API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mockUrl = `https://bos-vault.storage/invoices/${selectedPO.poNumber}_invoice.pdf`;

            // Create the update model
            const updateModel = {
                id: selectedPO.id,
                username: user.fullName || 'User',
                userId: user.id,
                ipAddress: '127.0.0.1',
                companyId: user.companyId || 1,
                vendorId: selectedPO.vendorId,
                orderDate: selectedPO.orderDate,
                items: selectedPO.items || [],
                expectedDeliveryDate: selectedPO.expectedDeliveryDate,
                notes: selectedPO.notes,
                invoiceUrl: mockUrl
            };

            const response = await procurementService.updatePurchaseOrder(updateModel as any);

            if (response.status) {
                AlertMessages.getSuccessMessage('Invoice uploaded successfully');
                // Refresh data
                fetchPOs();
                // Update local state for immediate feedback
                setSelectedPO({ ...selectedPO, invoiceUrl: mockUrl });
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to upload invoice');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveInvoice = async () => {
        if (!selectedPO || !user) return;

        try {
            const updateModel = {
                id: selectedPO.id,
                username: user.fullName || 'User',
                userId: user.id,
                ipAddress: '127.0.0.1',
                companyId: user.companyId || 1,
                vendorId: selectedPO.vendorId,
                orderDate: selectedPO.orderDate,
                items: selectedPO.items || [],
                expectedDeliveryDate: selectedPO.expectedDeliveryDate,
                notes: selectedPO.notes,
                invoiceUrl: '' // Clearing the URL
            };

            const response = await procurementService.updatePurchaseOrder(updateModel as any);

            if (response.status) {
                AlertMessages.getSuccessMessage('Invoice removed successfully');
                fetchPOs();
                setSelectedPO({ ...selectedPO, invoiceUrl: null });
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage('Failed to remove invoice');
        }
    };

    const generatePDF = (po: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>Purchase Order - ${po.poNumber}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #334155; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
                        .info-item { margin-bottom: 10px; }
                        .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px; }
                        .value { font-size: 14px; font-weight: 600; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f8fafc; text-align: left; padding: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
                        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                        .total { text-align: right; margin-top: 30px; font-size: 18px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 style="margin:0; color: #4f46e5;">PURCHASE ORDER</h1>
                            <div class="value">${po.poNumber}</div>
                        </div>
                        <div style="text-align: right">
                            <div class="label">Date</div>
                            <div class="value">${new Date(po.orderDate).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="info-grid">
                        <div>
                            <div class="info-item">
                                <div class="label">Company</div>
                                <div class="value">${po.companyName || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Vendor</div>
                                <div class="value">${po.vendorName}</div>
                            </div>
                        </div>
                        <div>
                            <div class="info-item">
                                <div class="label">Requester</div>
                                <div class="value">${po.requesterName}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Status</div>
                                <div class="value">${po.status}</div>
                            </div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Type</th>
                                <th style="text-align: right">Qty</th>
                                <th style="text-align: right">Price</th>
                                <th style="text-align: right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${po.items.map((item: any) => `
                                <tr>
                                    <td>${item.itemName}</td>
                                    <td>${item.assetTypeName || 'N/A'}</td>
                                    <td style="text-align: right">${Number(item.quantity) || 0}</td>
                                    <td style="text-align: right">${po.currency === 'INR' ? '₹' : '$'}${(Number(item.unitPrice) || 0).toFixed(2)}</td>
                                    <td style="text-align: right">${po.currency === 'INR' ? '₹' : '$'}${((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total">Total: ${po.currency === 'INR' ? '₹' : '$'}${(Number(po.totalAmount) || 0).toFixed(2)}</div>
                    <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; text-align: center;">
                        Generated via BOS Vault Procurement System
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        // Wait for styles/images to load if any, then print
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    useEffect(() => {
        fetchPOs();
    }, [fetchPOs]);

    const getStatusStyle = (status: POStatusEnum) => {
        switch (status) {
            case POStatusEnum.APPROVED:
                return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            case POStatusEnum.REJECTED:
                return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
            case POStatusEnum.ORDERED:
                return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case POStatusEnum.RECEIVED:
                return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status: POStatusEnum) => {
        switch (status) {
            case POStatusEnum.APPROVED: return <CheckCircle2 size={14} />;
            case POStatusEnum.REJECTED: return <XCircle size={14} />;
            case POStatusEnum.ORDERED: return <ShoppingCart size={14} />;
            case POStatusEnum.RECEIVED: return <Building size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };



    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50 space-y-8">
                <PageHeader
                    icon={<ShoppingCart className="text-white" />}
                    title="Procurement"
                    description="Manage purchase orders and vendor interactions"
                >
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="relative shrink-0 min-w-[160px]">
                            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <select
                                className="w-full pl-10 pr-8 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value={POStatusEnum.DRAFT}>Draft</option>
                                <option value={POStatusEnum.APPROVED}>Approved</option>
                                <option value={POStatusEnum.ORDERED}>Ordered</option>
                                <option value={POStatusEnum.RECEIVED}>Received</option>
                                <option value={POStatusEnum.PARTIALLY_RECEIVED}>Partially Received</option>
                                <option value={POStatusEnum.REJECTED}>Rejected</option>
                                <option value={POStatusEnum.CANCELLED}>Cancelled</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </PageHeader>

                {/* Metrics Dashboard Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5 flex items-center gap-4 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                            <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total POs</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalPOs}</h3>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-4 border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                            <DollarSign className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Spend</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">${totalSpend.toFixed(2)}</h3>
                        </div>
                    </Card>
                    <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow uppercase">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                            <Building className="text-emerald-600 dark:text-emerald-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Vendors</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{activeVendors}</h3>
                        </div>
                    </Card>
                    <Card
                        onClick={() => setIsModalOpen(true)}
                        className="p-5 flex items-center gap-4 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] bg-orange-50/10 dark:bg-orange-900/5"
                    >
                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition-colors">
                            <Plus className="text-orange-600 dark:text-orange-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Quick Action</p>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors uppercase">Add New Item</h3>
                        </div>
                    </Card>
                </div>

                {/* Tabs Switcher */}
                <div className="flex p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('OPEN')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'OPEN' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <FileText size={14} />
                        Open POs
                    </button>
                    <button
                        onClick={() => setActiveTab('APPROVED')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'APPROVED' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <CheckCircle2 size={14} />
                        Approved POs
                    </button>
                    <button
                        onClick={() => setActiveTab('REJECTED')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'REJECTED' ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <XCircle size={14} />
                        Rejected POs
                    </button>
                </div>

                <CreatePOModal
                    isOpen={isModalOpen || !!editPO}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditPO(null);
                    }}
                    onSuccess={fetchPOs}
                    initialPO={editPO}
                />

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                    </div>
                ) : filteredPOs.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4">
                            <ShoppingCart className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Purchase Orders Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-1">Start by creating your first purchase order to track IT asset procurement.</p>
                    </Card>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse border border-slate-200 dark:border-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Purchase Order</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Company</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Vendor</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider hidden md:table-cell border border-slate-200 dark:border-slate-800 text-center">Requester</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell border border-slate-200 dark:border-slate-800 text-center">Date</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Total Amount</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {filteredPOs.map((po) => (
                                        <tr key={po.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap border border-slate-200 dark:border-slate-800 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                                        <FileText className="text-indigo-600 dark:text-indigo-400" size={18} />
                                                    </div>
                                                    <span className="font-bold text-sm text-slate-900 dark:text-white">{po.poNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-slate-200 dark:border-slate-800 text-center">
                                                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                                    <Building size={14} className="text-slate-400" />
                                                    {po.companyName || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-slate-200 dark:border-slate-800 text-center">
                                                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                                    <Building size={14} className="text-slate-400" />
                                                    {po.vendorName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <User size={14} className="text-slate-400" />
                                                    {po.requesterName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell text-sm text-slate-500 border border-slate-200 dark:border-slate-800 text-center">
                                                {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 text-center">
                                                {po.currency === 'INR' ? '₹' : '$'}{(Number(po.totalAmount) || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-slate-200 dark:border-slate-800 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(po.status)}`}>
                                                    {getStatusIcon(po.status)}
                                                    {(po.status || 'unknown').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-slate-200 dark:border-slate-800 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedPO(po)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                        title="View PO Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditPO(po)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                        title="Edit PO"
                                                    >
                                                        <Pen size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePO(po.id)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                                        title="Delete PO"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* View Details Modal */}
                {selectedPO && (
                    <Modal
                        isOpen={!!selectedPO}
                        onClose={() => setSelectedPO(null)}
                        title={`Purchase Order: ${selectedPO.poNumber}`}
                        size="2xl"
                        footer={
                            <div className="flex gap-2 w-full justify-end items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => generatePDF(selectedPO)}
                                    className="mr-auto gap-2 text-slate-600 border-slate-200"
                                >
                                    <FileText size={16} />
                                    Download PDF
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedPO(null)}>Close</Button>
                                {(selectedPO.status !== POStatusEnum.APPROVED && selectedPO.status !== POStatusEnum.REJECTED) && (
                                    <>
                                        <Button
                                            className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
                                            onClick={() => handleStatusUpdate(selectedPO.id, POStatusEnum.REJECTED)}
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </Button>
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                            onClick={() => handleStatusUpdate(selectedPO.id, POStatusEnum.APPROVED)}
                                        >
                                            <CheckCircle2 size={16} />
                                            Approve
                                        </Button>
                                    </>
                                )}
                            </div>
                        }
                    >
                        <div className="space-y-6">
                            {/* Summary info */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(selectedPO.status)}`}>
                                        {getStatusIcon(selectedPO.status)}
                                        {selectedPO.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company</p>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <Building size={14} className="text-slate-400" />
                                        <span className="truncate">{selectedPO.companyName || 'N/A'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor</p>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <Building size={14} className="text-slate-400" />
                                        <span className="truncate">{selectedPO.vendorName}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requester</p>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <User size={14} className="text-slate-400" />
                                        <span className="truncate">{selectedPO.requesterName}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Order Date</p>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <Calendar size={14} className="text-slate-400" />
                                        {new Date(selectedPO.orderDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <ShoppingCart size={16} className="text-indigo-500" />
                                    Order Items
                                </h4>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-center bg-white dark:bg-slate-900 border-collapse border border-slate-200 dark:border-slate-800">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Item Name</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Type</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center border border-slate-200 dark:border-slate-800 text-center">Qty</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Unit Price</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-center">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {selectedPO.items?.length ? selectedPO.items.map((item: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 text-center">{item.itemName}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500 border border-slate-200 dark:border-slate-800 text-center">{item.assetTypeName || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500 text-center border border-slate-200 dark:border-slate-800 text-center">{Number(item.quantity) || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500 border border-slate-200 dark:border-slate-800 text-center">{selectedPO.currency === 'INR' ? '₹' : '$'}{(Number(item.unitPrice) || 0).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-center">{selectedPO.currency === 'INR' ? '₹' : '$'}{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500 border border-slate-200 dark:border-slate-800 text-center">No items available</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                                            <tr>
                                                <td colSpan={4} className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider text-right border border-slate-200 dark:border-slate-800">Total Amount:</td>
                                                <td className="px-4 py-3 text-lg font-black text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 text-center">{selectedPO.currency === 'INR' ? '₹' : '$'}{(Number(selectedPO.totalAmount) || 0).toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Notes & Additional info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Expected Delivery Date</p>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <Calendar size={14} className="text-slate-400" />
                                        {selectedPO.expectedDeliveryDate ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString() : 'Not Specified'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Additional Notes / Ref</p>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 min-h-[46px] whitespace-pre-wrap">
                                        {selectedPO.notes || 'No notes provided.'}
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Section */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <FileText size={16} className="text-blue-500" />
                                    Procurement Documents
                                </h4>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleInvoiceUpload}
                                />

                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                    {selectedPO.invoiceUrl ? (
                                        <div className="space-y-4 w-full max-w-sm">
                                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2 text-emerald-600">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-900 dark:text-white">Invoice Uploaded</h5>
                                                <p className="text-xs text-slate-500 mt-1">Official vendor invoice is attached to this PO</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
                                                    onClick={() => window.open(selectedPO.invoiceUrl, '_blank')}
                                                >
                                                    <ExternalLink size={16} />
                                                    View Invoice
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="gap-2 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-50"
                                                    onClick={handleRemoveInvoice}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-2 text-blue-500 group-hover:scale-110 transition-transform">
                                                <FileUp size={32} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-900 dark:text-white">No Invoice Attached</h5>
                                                <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Upload the final vendor invoice to complete the procurement records</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={16} />
                                                        Upload Invoice
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </RouteGuard>
    );
}

export default ProcurementPage;