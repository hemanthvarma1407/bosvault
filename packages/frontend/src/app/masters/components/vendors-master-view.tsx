'use client';

import { useState, useEffect, useRef } from 'react';
import { CreateVendorModel, UpdateVendorModel, Vendor } from '@bosvault/shared-models';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Plus, Pencil, Trash2, ArrowLeft, Eye, Store, Phone, Mail, MapPin, User, Tag, ShieldCheck } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { VendorService } from '@bosvault/shared-services';
import { formatPhoneNumberWithCountryCode } from '@/lib/utils';


interface VendorsMasterViewProps {
    onBack?: () => void;
}

export const VendorsMasterView: React.FC<VendorsMasterViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', contactPerson: '', email: '', phone: '', address: '', companyId: '', category: '', isActive: true });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const lastFetchedCompanyId = useRef<number | null>(null);
    const vendorService = new VendorService();

    useEffect(() => {
        if (user?.companyId && lastFetchedCompanyId.current !== user.companyId) {
            lastFetchedCompanyId.current = user.companyId;
            getAllVendors();
        }
    }, [user?.companyId]);



    const getAllVendors = async (): Promise<void> => {
        if (!user?.companyId) return;
        try {
            const response = await vendorService.getAllVendors();
            if (response.status) {
                setVendors(response.vendors as any);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    }

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!user) return;
        try {
            const companyIdToUse = Number(formData.companyId) || user.companyId;
            if (isEditMode && editingId) {
                const model = new UpdateVendorModel(editingId, formData.name, formData.description, formData.isActive, formData.contactPerson, formData.email, formData.phone, formData.address, companyIdToUse, formData.category);
                const response = await vendorService.updateVendor(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllVendors();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateVendorModel(user.id, companyIdToUse, formData.name, formData.description, formData.isActive ?? true, formData.contactPerson, formData.email, formData.phone, formData.address, formData.category);
                const response = await vendorService.createVendor(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllVendors();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleEdit = (item: Vendor): void => {
        setIsEditMode(true);
        setEditingId(item.id);
        setFormData({
            name: item.name,
            description: item.description || '',
            contactPerson: item.contactPerson || '',
            email: item.email || '',
            phone: item.phone || '',
            address: item.address || '',
            companyId: item.companyId?.toString() || '',
            category: item.category || '',
            isActive: item.isActive ?? true
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
                const response = await vendorService.deleteVendor({ id: deletingId });
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    getAllVendors();
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
        setFormData({ name: '', description: '', contactPerson: '', email: '', phone: '', address: '', companyId: '', category: '', isActive: true });
    };

    return (
        <>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden h-[600px] flex flex-col p-0">
                <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Vendors</h3>
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button size="xs" variant="primary" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                Back to Masters
                            </Button>
                        )}
                        <Button size="xs" variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
                            Add Vendor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Vendor Name</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Contact</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Category</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900">
                                {vendors?.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No vendors found</td></tr>
                                ) : (
                                    vendors?.map((item: Vendor) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{item.contactPerson || '-'}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 italic uppercase">{(item as any).category || '-'}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${item.isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                                    }`}>
                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => { setSelectedVendor(item); setIsDetailModalOpen(true); }} className="h-7 w-7 flex items-center justify-center rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm" title="View">
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
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? "Edit Vendor" : "Add Vendor"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Vendor Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14" required />
                        <Input label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="h-14" />
                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Contact Person" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="h-14" />
                        <PhoneInput label="Phone" value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} />
                    </div>
                    <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-14" />
                    <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-14" />
                    <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-14" />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" type="submit">{isEditMode ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName="Vendor"
            />

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Vendor Detailed Information"
                size="md"
            >
                {selectedVendor && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 border border-indigo-100 dark:border-indigo-800 shadow-sm transition-transform hover:scale-105">
                                <Store className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{(selectedVendor as any).category || 'Vendor Entity'}</p>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedVendor.name}</h4>
                            </div>
                            <span className={`mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${selectedVendor.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                }`}>
                                {selectedVendor.isActive ? 'Active Partnership' : 'Inactive Partnership'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 transition-colors group">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{selectedVendor.contactPerson || 'Not provided'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Tag className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Business Type</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{(selectedVendor as any).category || 'General'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate" title={selectedVendor.email}>{selectedVendor.email || 'None'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Phone className="h-3.5 w-3.5 text-purple-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Primary Phone</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatPhoneNumberWithCountryCode(selectedVendor.phone) || 'Not available'}</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registered Address</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                                    {selectedVendor.address || 'No registered office address available.'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Vendor Overview</label>
                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                                    {selectedVendor.description || 'No additional business description or partnership notes provided.'}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                                    <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                        This vendor record is strictly for internal administrative use. Ensure all modifications align with contractual agreements.
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
