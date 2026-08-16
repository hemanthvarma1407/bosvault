import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { CreateCredentialVaultModel, UpdateCredentialVaultModel, CredentialVaultModel, IdRequestModel } from '@bosvault/shared-models';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Pencil, Trash2, Key, Eye, EyeOff, Copy, ExternalLink, Shield, Hash, Globe, Mail, Fingerprint, ShieldCheck, User } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CredentialVaultService } from '@bosvault/shared-services';

interface CredentialVaultMasterViewProps {
    onBack?: () => void;
    searchTerm?: string;
    viewMode?: 'grid' | 'list';
}

export interface CredentialVaultMasterViewHandle {
    showAddModal: () => void;
}

export const CredentialVaultMasterView = forwardRef<CredentialVaultMasterViewHandle, CredentialVaultMasterViewProps>(({ onBack, searchTerm = '', viewMode = 'grid' }, ref) => {
    const { user } = useAuth();
    const [vaults, setVaults] = useState<CredentialVaultModel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        appName: '',
        description: '',
        password: '',
        expireDate: '',
        owner: '',
        deviceSerialNumber: '',
        ipAddress: '',
        recoveryEmail: '',
        isActive: true
    });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
    const [selectedCredential, setSelectedCredential] = useState<CredentialVaultModel | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const vaultService = new CredentialVaultService();
    const initialized = useRef(false);

    useImperativeHandle(ref, () => ({
        showAddModal: () => setIsModalOpen(true)
    }));

    useEffect(() => {
        if (!initialized.current && user?.companyId) {
            initialized.current = true;
            getAllVaults();
        }
    }, [user?.companyId]);

    const getAllVaults = async (): Promise<void> => {
        if (!user?.companyId) return;
        try {
            const req = new IdRequestModel(user.companyId);
            const response = await vaultService.getAllCredentialVaults(req);
            if (response.status) {
                setVaults(response.data || []);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const filteredVaults = useMemo(() => {
        return vaults.filter(v =>
            v.appName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.deviceSerialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.recoveryEmail?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [vaults, searchTerm]);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!user || (!user.companyId && user.companyId !== 0)) return;
        try {
            if (isEditMode && editingId) {
                const model = new UpdateCredentialVaultModel(
                    editingId,
                    formData.appName,
                    formData.description,
                    formData.password,
                    formData.expireDate ? new Date(formData.expireDate) : undefined,
                    formData.owner,
                    formData.isActive,
                    formData.deviceSerialNumber,
                    formData.ipAddress,
                    formData.recoveryEmail
                );
                const response = await vaultService.updateCredentialVault(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllVaults();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            } else {
                const model = new CreateCredentialVaultModel(
                    user.id,
                    user.companyId,
                    formData.appName,
                    formData.description,
                    formData.password,
                    formData.expireDate ? new Date(formData.expireDate) : undefined,
                    formData.owner,
                    formData.isActive ?? true,
                    formData.deviceSerialNumber,
                    formData.ipAddress,
                    formData.recoveryEmail
                );
                const response = await vaultService.createCredentialVault(model);
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    handleCloseModal();
                    getAllVaults();
                } else {
                    AlertMessages.getErrorMessage(response.message);
                }
            }
        } catch (err) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const handleEdit = (item: CredentialVaultModel, e: React.MouseEvent): void => {
        e.stopPropagation();
        setIsEditMode(true);
        setEditingId(item.id);
        const expireDateStr = item.expireDate
            ? (typeof item.expireDate === 'string' ? item.expireDate.split('T')[0] : new Date(item.expireDate).toISOString().split('T')[0])
            : '';

        setFormData({
            appName: item.appName || '',
            description: item.description || '',
            password: item.password || '',
            owner: item.owner || '',
            deviceSerialNumber: item.deviceSerialNumber || '',
            ipAddress: item.ipAddress || '',
            recoveryEmail: item.recoveryEmail || '',
            expireDate: expireDateStr,
            isActive: item.isActive ?? true
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number, e: React.MouseEvent): void => {
        e.stopPropagation();
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async (): Promise<void> => {
        if (deletingId) {
            try {
                const response = await vaultService.deleteCredentialVault({ id: deletingId });
                if (response.status) {
                    AlertMessages.getSuccessMessage(response.message);
                    getAllVaults();
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
            appName: '',
            description: '',
            password: '',
            expireDate: '',
            owner: '',
            deviceSerialNumber: '',
            ipAddress: '',
            recoveryEmail: '',
            isActive: true
        });
    };

    const toggleReveal = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        AlertMessages.getSuccessMessage('Copied to clipboard!');
    };

    const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return 'No expiry';
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="space-y-4">

            {filteredVaults.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-full">
                        <Key className="h-8 w-8 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-black uppercase tracking-widest text-slate-900 dark:text-white text-xs">No Credentials Found</p>
                        <p className="text-[10px] text-slate-500 font-medium max-w-xs mx-auto">No secrets found matching your query.</p>
                    </div>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Application</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Owner</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                                    <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredVaults.map((item) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shrink-0">
                                                    <Key className="h-4 w-4" />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.appName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-medium text-slate-500 truncate max-w-[150px] block">{item.description || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{item.owner || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-medium text-slate-500">{formatDate(item.expireDate)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${item.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                {item.isActive ? 'active' : 'inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedCredential(item); setIsDetailModalOpen(true); }} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"><Eye className="h-3.5 w-3.5" /></button>
                                                <button onClick={(e) => handleEdit(item, e)} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                                                <button disabled className="h-7 w-7 flex items-center justify-center rounded bg-red-500/50 text-white grayscale opacity-50 cursor-not-allowed shadow-sm" title="Delete disabled">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                    {filteredVaults.map((item) => (
                        <div
                            key={item.id}
                            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 p-5 overflow-hidden min-h-[220px]"
                            onClick={() => { setSelectedCredential(item); setIsDetailModalOpen(true); }}
                        >
                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-500">
                                <Key className="h-24 w-24 text-blue-500 rotate-12" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm flex-shrink-0">
                                            <span className="text-sm font-black text-blue-600 uppercase">{item.appName?.charAt(0)}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate uppercase leading-none">{item.appName}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 truncate mt-1 italic">{item.description || 'Secure System Credential'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border flex-shrink-0 ${item.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        {item.isActive ? 'active' : 'inactive'}
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 dark:bg-white/5 rounded-xl p-3.5 space-y-3 border border-slate-200 dark:border-white/5">
                                    <div className="flex items-center justify-between group/pw">
                                        <div className="space-y-0 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 tracking-widest truncate mr-4">
                                            {revealedPasswords[item.id] ? item.password : '••••••••••••'}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/pw:opacity-100 transition-opacity">
                                            <button onClick={(e) => toggleReveal(item.id, e)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-all">
                                                {revealedPasswords[item.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                            </button>
                                            <button onClick={(e) => copyToClipboard(item.password, e)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-all">
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-200/50 dark:bg-white/5" />

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9px] font-bold text-slate-500 leading-tight">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-slate-400 uppercase tracking-tight mb-0.5">Username</span>
                                            <span className="truncate text-slate-700 dark:text-slate-200">{item.owner || '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-slate-400 uppercase tracking-tight mb-0.5">Recovery</span>
                                            <span className="truncate text-slate-700 dark:text-slate-200">{item.recoveryEmail || '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-slate-400 uppercase tracking-tight mb-0.5">Serial</span>
                                            <span className="truncate text-slate-700 dark:text-slate-200">{item.deviceSerialNumber || '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-slate-400 uppercase tracking-tight mb-0.5">IP Binding</span>
                                            <span className="truncate text-slate-700 dark:text-slate-200">{item.ipAddress || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-200/50 dark:bg-white/5" />

                                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                        <p>Expiry Deadline</p>
                                        <p className="text-slate-500">{formatDate(item.expireDate)}</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={(e) => handleEdit(item, e)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-600 transition-all">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={(e) => handleDeleteClick(item.id, e)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-slate-400 hover:text-rose-600 transition-all">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    {item.description?.includes('http') && (
                                        <a href={item.description} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500 hover:text-blue-600 shadow-sm border border-transparent hover:border-blue-100 transition-all" onClick={(e) => e.stopPropagation()}>
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? "Update Sentinel Secret" : "Seal New Credential"}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Device / Application" value={formData.appName} onChange={(e) => setFormData({ ...formData, appName: e.target.value })} className="h-14" required />
                        <Input label="Username" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} className="h-14" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-14" required />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Encrypted at rest</p>
                        </div>
                        <Input label="Recovery Email" value={formData.recoveryEmail} onChange={(e) => setFormData({ ...formData, recoveryEmail: e.target.value })} className="h-14" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Device Serial Number" value={formData.deviceSerialNumber} onChange={(e) => setFormData({ ...formData, deviceSerialNumber: e.target.value })} className="h-14" />
                        <Input label="IP Address" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} className="h-14" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Expiry Date" type="date" value={formData.expireDate} onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })} className="h-14" />
                        <div className="flex items-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 h-14 translate-y-2">
                            <label className="flex items-center gap-3 cursor-pointer w-full">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 transition-all"
                                />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Active Access</span>
                            </label>
                        </div>
                    </div>

                    <Input label="Description / Security Notes" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-20" />

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-white/5">
                        <Button variant="outline" type="button" onClick={handleCloseModal} className="rounded-xl px-8 h-12 uppercase tracking-widest text-[10px] font-black">Cancel</Button>
                        <Button variant="primary" type="submit" className="rounded-xl px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 uppercase tracking-widest text-[10px] font-black">
                            {isEditMode ? 'Commit Changes' : 'Secure Credential'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={`${filteredVaults.find(v => v.id === deletingId)?.appName} Credential`}
            />

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Secret Security Detail"
                size="md"
            >
                {selectedCredential && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-200 dark:border-white/5">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 border border-blue-100 dark:border-blue-800 shadow-lg shadow-blue-500/10">
                                <Shield className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedCredential.appName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedCredential.description || 'Secure System Credential'}</p>
                            </div>
                            <span className={`mt-3 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${selectedCredential.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                {selectedCredential.isActive ? 'Verified Active' : 'Access Revoked'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Administrative Owner</span>
                                    </div>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{selectedCredential.owner || 'System Default'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recovery Endpoint</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedCredential.recoveryEmail || 'None Configured'}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900 dark:bg-black border border-white/10 shadow-inner group/pw">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Fingerprint className="h-3.5 w-3.5 text-blue-400" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Encrypted Secret</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/pw:opacity-100 transition-opacity">
                                        <button onClick={(e) => toggleReveal(selectedCredential.id, e)} className="p-1 px-2 rounded-lg bg-white/5 text-slate-400 hover:text-blue-400 transition-colors text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                            {revealedPasswords[selectedCredential.id] ? <><EyeOff className="h-2.5 w-2.5" /> Mask</> : <><Eye className="h-2.5 w-2.5" /> Reveal</>}
                                        </button>
                                        <button onClick={(e) => copyToClipboard(selectedCredential.password, e)} className="p-1 px-2 rounded-lg bg-white/5 text-slate-400 hover:text-blue-400 transition-colors text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Copy className="h-2.5 w-2.5" /> Copy
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xl font-mono font-black tracking-[0.25em] text-white overflow-hidden text-ellipsis bg-white/5 p-3 rounded-lg border border-white/5 shadow-inner">
                                    {revealedPasswords[selectedCredential.id] ? selectedCredential.password : '••••••••••••'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Hash className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Serial Number</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{selectedCredential.deviceSerialNumber || 'Not logged'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe className="h-3.5 w-3.5 text-purple-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IP Binding</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedCredential.ipAddress || 'Any IP'}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg shrink-0">
                                        <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">Expiration Timeline</p>
                                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-500">Scheduled for revision on {formatDate(selectedCredential.expireDate)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-white/5">
                            <Button variant="primary" onClick={() => setIsDetailModalOpen(false)} className="rounded-xl px-12 h-12 uppercase tracking-widest text-[10px] font-black">Close Session</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
});

CredentialVaultMasterView.displayName = 'CredentialVaultMasterView';
