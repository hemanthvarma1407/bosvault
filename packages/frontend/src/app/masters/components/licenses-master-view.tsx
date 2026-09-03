'use client';

import { useState, useEffect, useRef } from 'react';
import { CreateLicenseMasterModel, UpdateLicenseMasterModel, License } from '@bosvault/shared-models';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Plus, Pencil, Trash2, ArrowLeft, Eye, Key, ShieldCheck, Calendar, Info } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LicenseMasterService } from '@bosvault/shared-services';

interface LicensesMasterViewProps {
    onBack?: () => void;
}

export const LicensesMasterView: React.FC<LicensesMasterViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [licenses, setLicenses] = useState<License[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        purchaseDate: string;
        expiryDate: string;
        isActive: boolean;
        totalQuantity: string | number;
        price: string | number;
        subscriptionPlan: string;
        isPaid: boolean;
        billingCycle: string;
    }>({
        name: '',
        description: '',
        purchaseDate: '',
        expiryDate: '',
        isActive: true,
        totalQuantity: '',
        price: '',
        subscriptionPlan: 'Standard',
        isPaid: true,
        billingCycle: 'MONTHLY'
    });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const licenseService = new LicenseMasterService();
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            getAllLicenses();
        }
    }, []);

    const getAllLicenses = async (): Promise<void> => {
        try {
            if (!user?.companyId) return;
            const response = await licenseService.getAllLicenses();
            if (response.status) {
                setLicenses(response.licenses || []);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!user) return;
        try {
            if (isEditMode && editingId) {
                const model = new UpdateLicenseMasterModel(
                    editingId,
                    formData.name,
                    formData.description,
                    formData.isActive,
                    formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
                    formData.expiryDate ? new Date(formData.expiryDate) : undefined,
                    Number(formData.totalQuantity),
                    Number(formData.price),
                    formData.subscriptionPlan,
                    formData.isPaid,
                    formData.billingCycle
                );
                const response = await licenseService.updateLicense(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllLicenses();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateLicenseMasterModel(
                    user.id,
                    user.companyId!,
                    formData.name,
                    formData.description,
                    formData.isActive,
                    formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
                    formData.expiryDate ? new Date(formData.expiryDate) : undefined,
                    Number(formData.totalQuantity),
                    undefined,
                    Number(formData.price),
                    formData.subscriptionPlan,
                    formData.isPaid,
                    formData.billingCycle
                );
                const response = await licenseService.createLicense(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllLicenses();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (err) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleEdit = (item: License): void => {
        setIsEditMode(true);
        setEditingId(item.id);
        const licObj = item as any;
        setFormData({
            name: item.name,
            description: item.description || '',
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
            expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
            isActive: item.isActive ?? true,
            totalQuantity: licObj.totalQuantity || 0,
            price: licObj.price || 0,
            subscriptionPlan: licObj.subscriptionPlan || 'Standard',
            isPaid: licObj.isPaid !== undefined ? Boolean(licObj.isPaid) : true,
            billingCycle: licObj.billingCycle || 'MONTHLY'
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number): void => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async (): Promise<void> => {
        if (deletingId) {
            try {
                const response = await licenseService.deleteLicense({ id: deletingId });
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    getAllLicenses();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } catch (err) {
                AlertMessages.getErrorMessage(err.message);
            }
        }
    };

    const handleCloseModal = (): void => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            purchaseDate: '',
            expiryDate: '',
            isActive: true,
            totalQuantity: '',
            price: '',
            subscriptionPlan: 'Standard',
            isPaid: true,
            billingCycle: 'MONTHLY'
        });
    };

    const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
    };

    return (
        <>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden h-[600px] flex flex-col p-0">
                <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Tools & Subscriptions Catalog</h3>
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button size="xs" variant="primary" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                Back to Masters
                            </Button>
                        )}
                        <Button size="xs" variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
                            Add Tool / Subscription
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Tool Name</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Plan</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Type</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Total Seats</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Assigned</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Available</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Price/Seat</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Total Value</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900">
                                {licenses?.length === 0 ? (
                                    <tr><td colSpan={10} className="p-8 text-center text-slate-500">No tools or software subscriptions found</td></tr>
                                ) : (
                                    licenses.map(item => {
                                        const licObj = item as any;
                                        const total = Number(licObj.totalQuantity || 0);
                                        const used = Number(licObj.usedCount ?? licObj.usedQuantity ?? 0);
                                        const unitPrice = Number(licObj.price || 0);
                                        const isExceeded = used > total && total > 0;
                                        const available = Math.max(0, total - used);
                                        const isPaid = licObj.isPaid !== false && licObj.isPaid !== 'false';
                                        const plan = licObj.subscriptionPlan || 'Standard';

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-4 py-3 text-left border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white">
                                                    <div>{item.name}</div>
                                                    {item.description && <div className="text-xs text-slate-400 font-normal truncate max-w-xs">{item.description}</div>}
                                                </td>
                                                <td className="px-3 py-3 text-center border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                        {plan}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center border border-slate-200 dark:border-slate-700 text-xs">
                                                    <span className={`px-2 py-0.5 rounded-full font-bold ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400'}`}>
                                                        {isPaid ? 'Paid' : 'Free'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 font-bold">{total}</td>
                                                <td className="px-3 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-bold">
                                                    <span className={isExceeded ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-700 dark:text-slate-300'}>
                                                        {used}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    {available}
                                                </td>
                                                <td className="px-3 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                                                    ${unitPrice.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal">/{licObj.billingCycle === 'YEARLY' ? 'yr' : 'mo'}</span>
                                                </td>
                                                <td className="px-3 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-bold text-indigo-600 dark:text-indigo-400">${(unitPrice * total).toLocaleString()}</td>
                                                <td className="px-3 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm">
                                                    {isExceeded ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" title={`Assigned count (${used}) exceeds total capacity (${total})`}>
                                                            Over-allocated (+{used - total})
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${item.isActive
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                            : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                                            }`}>
                                                            {item.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => { setSelectedLicense(item); setIsDetailModalOpen(true); }} className="h-7 w-7 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm" title="View">
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
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? "Edit Tool / Subscription" : "Add Tool / Subscription"} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Tool / Software Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12" placeholder="e.g. Google Workspace, Slack, Jira, GitHub..." required />
                    <Input label="Description / Features" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-12" placeholder="Subscription tier details, admin URL..." />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Subscription Plan" value={formData.subscriptionPlan} onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })} className="h-12" placeholder="Free, Pro, Enterprise, Business..." />
                        <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Status</label>
                            <select
                                value={formData.isPaid ? 'paid' : 'free'}
                                onChange={(e) => setFormData({ ...formData, isPaid: e.target.value === 'paid' })}
                                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="paid">Paid Subscription</option>
                                <option value="free">Free Tier</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Billing Cycle</label>
                            <select
                                value={formData.billingCycle}
                                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="MONTHLY">Monthly</option>
                                <option value="YEARLY">Yearly / Annual</option>
                                <option value="ONE_TIME">One-Time / Perpetual</option>
                                <option value="FREE">Free</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Total Seats / License Count" type="number" min="0" value={formData.totalQuantity} onChange={e => setFormData({ ...formData, totalQuantity: Number(e.target.value) })} className="h-12" required />
                        <Input label="Price per Seat ($)" type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="h-12" />
                        <Input label="Renewal / Expiry Date" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="h-12" />
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                            Calculated Total Subscription Value:
                        </span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                            ${((Number(formData.price) || 0) * (Number(formData.totalQuantity) || 0)).toLocaleString()} / {formData.billingCycle.toLowerCase()}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-slate-900 dark:text-white border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active in Tools Catalog
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" type="submit">{isEditMode ? 'Update Tool' : 'Save Tool'}</Button>
                    </div>
                </form>
            </Modal>

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName="License"
            />

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="License Details"
                size="md"
            >
                {selectedLicense && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 border border-amber-100 dark:border-amber-800 shadow-sm">
                                <Key className="h-8 w-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight text-center">{selectedLicense.name}</h4>
                            <span className={`mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${selectedLicense.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                }`}>
                                {selectedLicense.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Purchase Date</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(selectedLicense.purchaseDate)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(selectedLicense.expiryDate)}</p>
                                </div>
                            </div>

                            {(() => {
                                const selObj = selectedLicense as unknown as { totalQuantity?: number; usedCount?: number; usedQuantity?: number };
                                const selTotal = Number(selObj.totalQuantity || 0);
                                const selUsed = Number(selObj.usedCount ?? selObj.usedQuantity ?? 0);
                                return (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block mb-1">Total</span>
                                            <p className="text-lg font-black text-slate-900 dark:text-white dark:text-slate-300">{selTotal}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50">
                                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Used</span>
                                            <p className="text-lg font-black text-amber-600 dark:text-amber-400">{selUsed}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Available</span>
                                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{Math.max(0, selTotal - selUsed)}</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Description</label>
                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                                    {selectedLicense.description || 'No additional description provided for this software license.'}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50">
                                    <Info className="h-4 w-4 text-slate-900 dark:text-white flex-shrink-0" />
                                    <p className="text-[10px] text-slate-900 dark:text-white dark:text-slate-300 font-medium">
                                        Ensure to renew the license before the expiry date to avoid service interruption.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800">
                            <Button variant="primary" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
