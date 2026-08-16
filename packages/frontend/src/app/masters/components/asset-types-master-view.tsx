'use client';

import { useState, useEffect, useRef } from 'react';
import { CreateAssetTypeModel, UpdateAssetTypeModel, AssetType } from '@bosvault/shared-models';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Plus, Pencil, Trash2, ArrowLeft, Eye, Monitor, HardDrive, Hash } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { AssetTypeService } from '@bosvault/shared-services';


interface AssetTypesMasterViewProps {
    onBack?: () => void;
}

export const AssetTypesMasterView: React.FC<AssetTypesMasterViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const initialized = useRef(false);
    const assetTypeService = new AssetTypeService();

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            getAllAssetTypes();
        }
    }, []);

    const getAllAssetTypes = async (): Promise<void> => {
        try {
            const response = await assetTypeService.getAllAssetTypes();
            if (response.status) {
                setAssetTypes(response.assetTypes || []);
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
                const model = new UpdateAssetTypeModel(editingId, formData.name, formData.description, formData.isActive);
                const response = await assetTypeService.updateAssetType(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllAssetTypes();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateAssetTypeModel(user.id, 0, formData.name, formData.description, formData.isActive ?? true);
                const response = await assetTypeService.createAssetType(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllAssetTypes();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (err) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleEdit = (item: AssetType): void => {
        setIsEditMode(true);
        setEditingId(item.id);
        setFormData({
            name: item.name,
            description: item.description || '',
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
                const response = await assetTypeService.deleteAssetType({ id: deletingId });
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    getAllAssetTypes();
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
        setFormData({ name: '', description: '', isActive: true });
    };

    return (
        <>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden h-[600px] flex flex-col p-0">
                <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Asset Types</h3>
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button size="xs" variant="primary" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                Back to Masters
                            </Button>
                        )}
                        <Button size="xs" variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
                            Add Asset Type
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Asset Type</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Description</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900">
                                {assetTypes?.length === 0 ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-slate-500">No asset types found</td></tr>
                                ) : (
                                    assetTypes?.map((item: AssetType) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">{item.description || '-'}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => { setSelectedAssetType(item); setIsDetailModalOpen(true); }} className="h-7 w-7 flex items-center justify-center rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm" title="View">
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

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? "Edit Asset Type" : "Add Asset Type"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Asset Type Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-14"
                        required
                    />



                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                            placeholder="Enter asset type description..."
                        />
                    </div>



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
                itemName="Asset Type"
            />

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Asset Type Details"
                size="md"
            >
                {selectedAssetType && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                <Monitor className="h-8 w-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedAssetType.name}</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                    {selectedAssetType.description || 'No description provided for this asset type.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type ID</label>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-indigo-500" /> #{selectedAssetType.id}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 text-emerald-500" /> Infrastructure
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
