'use client';

import { useState, useEffect, useRef } from 'react';
import { CreateRemoteMasterModel, UpdateRemoteMasterModel, RemoteMaster, IdRequestModel } from '@bosvault/shared-models';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Plus, Pencil, Trash2, ArrowLeft, Eye, TrendingUp, Globe, Shield } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RemoteService } from '@bosvault/shared-services';

interface RemoteMasterViewProps {
    onBack?: () => void;
}

export const RemoteMasterView: React.FC<RemoteMasterViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [remoteTools, setRemoteTools] = useState<RemoteMaster[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ remoteToolName: '', userName: '', userFullname: '', deviceSerialNumber: '', ipAddress: '', recoveryEmail: '', password: '', notes: '', isActive: true });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [selectedTool, setSelectedTool] = useState<RemoteMaster | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const remoteService = new RemoteService();
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current && user?.companyId) {
            initialized.current = true;
            getAllRemoteTools();
        }
    }, [user?.companyId]);

    const getAllRemoteTools = async (): Promise<void> => {
        if (!user?.companyId) return;
        try {
            const req = new IdRequestModel(user.companyId);
            const response = await remoteService.getAllRemote(req);
            if (response.status) {
                setRemoteTools(response.data || []);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!user) return;
        try {
            if (isEditMode && editingId) {
                const model = new UpdateRemoteMasterModel(
                    editingId,
                    formData.remoteToolName,
                    formData.userName,
                    formData.password,
                    formData.notes,
                    formData.isActive,
                    formData.userFullname,
                    formData.deviceSerialNumber,
                    formData.ipAddress,
                    formData.recoveryEmail
                );
                const response = await remoteService.updateRemote(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllRemoteTools();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateRemoteMasterModel(
                    user.id,
                    user.companyId,
                    formData.remoteToolName,
                    formData.userName,
                    formData.password,
                    formData.notes,
                    formData.isActive ?? true,
                    formData.userFullname,
                    formData.deviceSerialNumber,
                    formData.ipAddress,
                    formData.recoveryEmail
                );
                const response = await remoteService.createRemote(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllRemoteTools();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleEdit = (item: RemoteMaster): void => {
        setIsEditMode(true);
        setEditingId(item.id);
        setFormData({
            remoteToolName: item.remoteToolName,
            userName: item.userName,
            userFullname: item.userFullname || '',
            deviceSerialNumber: item.deviceSerialNumber || '',
            ipAddress: item.ipAddress || '',
            recoveryEmail: item.recoveryEmail || '',
            password: item.password,
            notes: item.notes || '',
            isActive: item.isActive ?? true
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
                const response = await remoteService.deleteRemote({ id: deletingId });
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    getAllRemoteTools();
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
        setFormData({
            remoteToolName: '',
            userName: '',
            userFullname: '',
            deviceSerialNumber: '',
            ipAddress: '',
            recoveryEmail: '',
            password: '',
            notes: '',
            isActive: true
        });
    };

    return (
        <>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden h-[600px] flex flex-col p-0">
                <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Remote Tools</h3>
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button size="xs" variant="primary" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                Back to Masters
                            </Button>
                        )}
                        <Button size="xs" variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
                            Add Remote Tool
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Tool Name</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">User</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900">
                                {remoteTools?.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No records found</td></tr>
                                ) : (
                                    remoteTools?.map((item: RemoteMaster) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white uppercase tracking-tight">{item.remoteToolName}</td>
                                            <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700 text-sm text-slate-500 truncate max-w-[150px]">{item.userFullname || item.userName}</td>
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
                                                    <button onClick={() => { setSelectedTool(item); setIsDetailModalOpen(true); }} className="h-7 w-7 flex items-center justify-center rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm" title="View">
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

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? "Edit Remote Tool" : "Add Remote Tool"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Tool Name" value={formData.remoteToolName} onChange={(e) => setFormData({ ...formData, remoteToolName: e.target.value })} className="h-12" required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="User ID" value={formData.userName} onChange={(e) => setFormData({ ...formData, userName: e.target.value })} className="h-12" required />
                        <Input label="Password" type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-12" required />
                    </div>
                    <Input label="User Full Name" value={formData.userFullname} onChange={(e) => setFormData({ ...formData, userFullname: e.target.value })} className="h-12" />
                    <Input label="Description" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="h-12" />
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
                onConfirm={handleConfirmDelete}
                itemName="Remote Tool"
            />

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Remote Tool Access Details"
                size="md"
            >
                {selectedTool && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                <Globe className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{selectedTool.remoteToolName}</p>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedTool.userFullname || 'System User'}</h4>
                            </div>
                            <span className={`mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${selectedTool.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                                }`}>
                                {selectedTool.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <TrendingUp className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">User ID</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{(selectedTool as any).userName || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <Shield className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Password</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{(selectedTool as any).password || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Access Notes</label>
                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                                    {selectedTool.notes || 'No security notes or additional details provided for this remote access record.'}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                                    <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                        Credentials for this tool are stored securely. Contact your administrator if password reset is required.
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
