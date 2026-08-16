'use client';

import { useState, useEffect, useRef } from 'react';
import { CreateDeviceConfigModel, UpdateDeviceConfigModel, DeviceConfig, AssetType } from '@bosvault/shared-models';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Plus, Pencil, Trash2, ArrowLeft, Eye, Laptop, Cpu, Database } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceConfigService, AssetTypeService } from '@bosvault/shared-services';


interface DeviceConfigsMasterViewProps {
    onBack?: () => void;
}

export const DeviceConfigsMasterView: React.FC<DeviceConfigsMasterViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [configs, setConfigs] = useState<DeviceConfig[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ laptopCompany: '', model: '', configuration: '', ram: '', storage: '', assetType: '' });
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<DeviceConfig | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const lastFetchedCompanyId = useRef<number | null>(null);
    const deviceConfigService = new DeviceConfigService();
    const assetTypeService = new AssetTypeService();

    useEffect(() => {
        if (user?.companyId && lastFetchedCompanyId.current !== user.companyId) {
            lastFetchedCompanyId.current = user.companyId;
            getAllConfigs();
            getAssetTypes();
        }
    }, [user?.companyId]);

    const getAssetTypes = async (): Promise<void> => {
        try {
            const response = await assetTypeService.getAllAssetTypes();
            if (response.status) {
                setAssetTypes(response.assetTypes || []);
            }
        } catch (error) {
            console.error('Failed to fetch asset types', error);
        }
    };

    const getAllConfigs = async (): Promise<void> => {
        try {
            const response = await deviceConfigService.getAllDeviceConfigs();
            if (response.status) {
                setConfigs(response.deviceConfigs || []);
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
                const model = new UpdateDeviceConfigModel(
                    editingId,
                    `${formData.laptopCompany} ${formData.model}`,
                    formData.configuration,
                    true,
                    formData.laptopCompany,
                    formData.model,
                    formData.configuration,
                    formData.ram,
                    formData.storage,
                    formData.assetType
                );
                const response = await deviceConfigService.updateDeviceConfig(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllConfigs();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateDeviceConfigModel(
                    user.id,
                    0,
                    `${formData.laptopCompany} ${formData.model}`,
                    formData.configuration,
                    true,
                    formData.laptopCompany,
                    formData.model,
                    formData.configuration,
                    formData.ram,
                    formData.storage,
                    undefined,
                    formData.assetType
                );
                const response = await deviceConfigService.createDeviceConfig(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllConfigs();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (err) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleEdit = (item: DeviceConfig): void => {
        setIsEditMode(true);
        setEditingId(item.id);
        setFormData({
            laptopCompany: item.laptopCompany || '',
            model: item.model || '',
            configuration: item.configuration || '',
            ram: item.ram || '',
            storage: item.storage || '',
            assetType: item.assetType || ''
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
                const response = await deviceConfigService.deleteDeviceConfig({ id: deletingId });
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    getAllConfigs();
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
        setFormData({ laptopCompany: '', model: '', configuration: '', ram: '', storage: '', assetType: '' });
    };

    return (
        <>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden h-full flex flex-col p-0">
                <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Device Configurations</h3>
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button size="xs" variant="primary" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                Back to Masters
                            </Button>
                        )}
                        <Button size="xs" variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
                            Add Configuration
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Laptop Company</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Model</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Asset Type</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Configuration</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900">
                                {configs?.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No configurations found</td></tr>
                                ) : (
                                    configs?.map((item: DeviceConfig) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white uppercase tracking-tight">{item.laptopCompany}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">{item.model || '-'}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">{item.assetType || '-'}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{item.configuration || '-'}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => { setSelectedConfig(item); setIsDetailModalOpen(true); }} className="h-7 w-7 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-900 text-white transition-colors shadow-sm" title="View">
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

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? "Edit Device Configuration" : "Add Device Configuration"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Company" value={formData.laptopCompany} onChange={(e) => setFormData({ ...formData, laptopCompany: e.target.value })} className="h-14" required />

                    <Input label="Model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="h-14" required />

                    <Select
                        label="Asset Type"
                        value={formData.assetType}
                        onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                        options={[
                            { value: '', label: 'Select Asset Type' },
                            ...assetTypes.map(at => ({ value: at.name, label: at.name }))
                        ]}
                        className="h-14"
                    />

                    <Input label="Configuration" value={formData.configuration} onChange={(e) => setFormData({ ...formData, configuration: e.target.value })} className="h-14" />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="RAM" value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} className="h-14" />
                        <Input label="Storage" value={formData.storage} onChange={(e) => setFormData({ ...formData, storage: e.target.value })} className="h-14" />
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
                itemName="Configuration"
            />

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Device Configuration Details"
                size="md"
            >
                {selectedConfig && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 dark:bg-blue-900/20 text-slate-900 dark:text-white dark:text-slate-300 flex items-center justify-center mb-3 border border-blue-100 dark:border-blue-800 shadow-sm">
                                <Laptop className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{selectedConfig.laptopCompany}</p>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedConfig.model}</h4>
                            </div>
                            <span className="mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800/60 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-slate-300 dark:border-indigo-800 uppercase tracking-widest">
                                {selectedConfig.assetType || 'Standard Device'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Cpu className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">RAM Memory</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedConfig.ram || 'Not specified'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Database className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Storage Capacity</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedConfig.storage || 'Not specified'}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Detailed Configuration</label>
                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                                    {selectedConfig.configuration || 'No additional technical specifications provided for this configuration.'}
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
