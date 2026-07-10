'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { documentsService } from '@/lib/api/services';
import { DocumentModel, UploadDocumentModel } from '@bosvault/shared-models';
import { Button } from '@/components/ui/Button';
import { FileText, Upload, Download, Trash2, Search, FileSpreadsheet, Image as ImageIcon, FileCode, FileArchive, Plus, File as FileIcon, Lock, Eye } from 'lucide-react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum } from '@bosvault/shared-models';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { GetAllDocumentsRequestModel } from '@bosvault/shared-models';

const DocumentsPage: React.FC = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<DocumentModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<DocumentModel | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [secureDocId, setSecureDocId] = useState<number | null>(null);
    const [securePassword, setSecurePassword] = useState('');

    const fetchDocuments = useCallback(async () => {
        if (!user) return;
        try {
            // Global Vault: We removed companyId requirement to allow global document access
            const req: GetAllDocumentsRequestModel = {};
            const response = await documentsService.getAllDocuments(req);
            if (response.status) {
                setDocuments(response.documents || []);
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to fetch documents');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to fetch documents');
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchDocuments();
        }
    }, [fetchDocuments, user]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    }, []);

    const handleUpload = useCallback(async () => {
        if (!selectedFile || !user) return;
        setIsLoading(true);

        try {
            const uploadModel: UploadDocumentModel = {
                category: category || 'General',
                description: description || undefined,
                tags: tags || undefined,
                companyId: user.companyId,
                userId: user.id
            };

            const response = await documentsService.uploadDocument(selectedFile, uploadModel);
            if (response.status) {
                AlertMessages.getSuccessMessage('Document integrated into vault successfully');
                setSelectedFile(null);
                setCategory('');
                setDescription('');
                setTags('');
                setIsUploadModalOpen(false);
                fetchDocuments();
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to synchronize document with vault');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to synchronize document with vault');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFile, category, description, tags, fetchDocuments, user]);

    const formatFileSize = useCallback((bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    const getFileIcon = useCallback((mimeType: string) => {
        const size = "h-5 w-5";
        if (mimeType.includes('pdf')) return <FileText className={`${size} text-rose-500`} />;
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
            return <FileSpreadsheet className={`${size} text-emerald-500`} />;
        if (mimeType.includes('image')) return <ImageIcon className={`${size} text-blue-500`} />;
        if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('html'))
            return <FileCode className={`${size} text-amber-500`} />;
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive'))
            return <FileArchive className={`${size} text-purple-500`} />;
        return <FileIcon className={`${size} text-slate-400`} />;
    }, []);

    const handleDelete = useCallback((id: number) => {
        const doc = documents.find(d => d.id === id);
        if (doc) {
            setDocumentToDelete(doc);
            setIsDeleteModalOpen(true);
        }
    }, [documents]);

    const confirmDelete = useCallback(async () => {
        if (!documentToDelete) return;
        try {
            const response = await documentsService.deleteDocument({ id: documentToDelete.id, userId: user?.id || 1 });
            if (response.status) {
                AlertMessages.getSuccessMessage('Document removed from vault');
                fetchDocuments();
                setIsDeleteModalOpen(false);
                setDocumentToDelete(null);
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to delete document');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Failed to delete document');
        }
    }, [documentToDelete, fetchDocuments, user]);

    const handleDownload = async (id: number) => {
        try {
            const response = await documentsService.getDocument({ id });
            if (!response.status) throw new Error(response.message);

            const doc = response.document as DocumentModel;
            if (doc.isSecure) {
                setSecureDocId(id);
                setIsPasswordModalOpen(true);
                return;
            }

            // Normal download flow
            const dlResponse = await documentsService.downloadDocument({ id });
            if (dlResponse.status && dlResponse.downloadPath) {
                const url = documentsService.getDownloadUrl(dlResponse.downloadPath, dlResponse.originalName);
                const fetchRes = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    }
                });
                const blob = await fetchRes.blob();
                const dlUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = dlUrl;
                link.setAttribute('download', dlResponse.originalName);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(dlUrl);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const handleView = async (id: number) => {
        try {
            const response = await documentsService.getDocument({ id });
            if (!response.status) throw new Error(response.message);

            const doc = response.document as DocumentModel;
            if (doc.isSecure) {
                // Secure documents require password even for viewing
                setSecureDocId(id);
                setIsPasswordModalOpen(true);
                return;
            }

            const dlResponse = await documentsService.downloadDocument({ id });
            if (dlResponse.status && dlResponse.downloadPath) {
                const url = documentsService.getDownloadUrl(dlResponse.downloadPath, dlResponse.originalName);
                const fetchRes = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    }
                });
                const blob = await fetchRes.blob();
                const viewUrl = window.URL.createObjectURL(blob);
                window.open(viewUrl, '_blank');
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message);
        }
    };

    const handleSecureDownloadOrView = async () => {
        if (!secureDocId || !securePassword) return;
        setIsLoading(true);
        try {
            const doc = documents.find(d => d.id === secureDocId);
            const dlResponse = await documentsService.downloadDocument({ id: secureDocId, password: securePassword });
            if (dlResponse.status && dlResponse.downloadPath) {
                const url = documentsService.getDownloadUrl(dlResponse.downloadPath, dlResponse.originalName);
                const fetchRes = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    }
                });
                const blob = await fetchRes.blob();
                const dlUrl = window.URL.createObjectURL(blob);

                // For secure, we just allow download for now as it's "Unlock & Download" in UI
                const link = document.createElement('a');
                link.href = dlUrl;
                link.setAttribute('download', dlResponse.originalName);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(dlUrl);

                setIsPasswordModalOpen(false);
                setSecurePassword('');
                setSecureDocId(null);
            }
        } catch (error: any) {
            AlertMessages.getErrorMessage(error.message || 'Invalid password or download failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.originalName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || doc.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [documents, searchQuery, activeCategory]);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(documents.map(d => d.category).filter(Boolean)));
        return ['All', ...cats];
    }, [documents]);

    const stats = useMemo(() => {
        const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
        return {
            total: documents.length,
            totalSize: (totalSize / (1024 * 1024)).toFixed(2),
            categories: categories.length,
        };
    }, [documents, categories]);

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]}>
            <div className="p-4 lg:p-8 min-h-screen bg-slate-50/50 dark:bg-slate-950 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md rotate-2 hover:rotate-0 transition-transform duration-300">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Document Repository</h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global Knowledge Vault</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group/search">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Locate document..."
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm w-full sm:w-[240px] font-medium shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="success"
                            onClick={() => setIsUploadModalOpen(true)}
                            className="rounded-xl px-5 font-black uppercase tracking-widest text-[9px] h-9 shadow-md"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                            Upload Document
                        </Button>
                    </div>
                </div>

                {/* Categories & Stats Bar */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat || 'General')}
                                className={`
                                        px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                                        ${activeCategory === cat
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50'
                                    }
                                    `}
                            >
                                {cat || 'General'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total Files', val: stats.total, color: 'indigo' },
                            { label: 'Storage Usage', val: `${stats.totalSize} MB`, color: 'emerald' },
                            { label: 'Categories', val: stats.categories, color: 'amber' }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-[120px]">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</span>
                                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{stat.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {filteredDocuments.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/40 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                            <FileText className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Documents Not Found</h3>
                        <p className="text-xs font-medium text-slate-500 max-w-xs mt-2 uppercase tracking-widest">The requested document collection is currently empty or has been moved.</p>
                        <Button
                            variant="outline"
                            onClick={() => setIsUploadModalOpen(true)}
                            className="mt-8 rounded-xl"
                        >
                            Add First Document
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                        <th className="pl-8 pr-4 py-4">Document Asset</th>
                                        <th className="px-4 py-4">Category</th>
                                        <th className="px-4 py-4">Storage Details</th>
                                        <th className="px-4 py-4 text-right pr-8">Management</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredDocuments.map((doc) => (
                                        <tr key={doc.id} className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                                            <td className="pl-8 pr-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                        {getFileIcon(doc.mimeType)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-[13px] text-slate-900 dark:text-white truncate max-w-md group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.originalName}</p>
                                                            {doc.isSecure && <Lock className="w-3 h-3 text-amber-500" />}
                                                        </div>
                                                        <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Vault ID: {doc.id.toString().padStart(4, '0')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                                    {doc.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-5">
                                                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{formatFileSize(doc.fileSize)}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 tracking-tighter">{doc.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                            </td>
                                            <td className="px-4 py-5 text-right pr-8">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleView(doc.id)}
                                                        className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl text-indigo-500 transition-all hover:scale-110 active:scale-95"
                                                        title="View Integrity"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(doc.id)}
                                                        className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-xl text-emerald-500 transition-all hover:scale-110 active:scale-95"
                                                        title="Download Secure Copy"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl text-rose-500 transition-all hover:scale-110 active:scale-95"
                                                        title="Remove from Vault"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

                {/* Upload Modal */}
                <Modal
                    isOpen={isUploadModalOpen}
                    onClose={() => {
                        setIsUploadModalOpen(false);
                        setSelectedFile(null);
                        setCategory('');
                        setDescription('');
                        setTags('');
                    }}
                    title="Upload New Document"
                    size="lg"
                >
                    <div className="space-y-6 pt-2">
                        <div
                            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 ${selectedFile
                                ? 'border-emerald-500/50 bg-emerald-50/10'
                                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                                }`}
                            onClick={() => document.getElementById('file-upload-modal')?.click()}
                        >
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload-modal"
                            />
                            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform duration-300 ${selectedFile ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}>
                                <Upload className="h-8 w-8" />
                            </div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                                {selectedFile ? 'File Selected' : 'Choose a file to upload'}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {selectedFile ? selectedFile.name : 'Click here or drag and drop any document'}
                            </p>
                            {selectedFile && (
                                <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    {formatFileSize(selectedFile.size)}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tags</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Description</label>
                            <textarea
                                placeholder="What is this document about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setSelectedFile(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleUpload}
                                isLoading={isLoading}
                                disabled={!selectedFile}
                                className="shadow-lg shadow-emerald-500/20 px-8"
                            >
                                Confirm Upload
                            </Button>
                        </div>
                    </div>
                </Modal>
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setDocumentToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete Document"
                    itemName={documentToDelete ? documentToDelete.originalName : undefined}
                />

                <Modal
                    isOpen={isPasswordModalOpen}
                    onClose={() => {
                        setIsPasswordModalOpen(false);
                        setSecurePassword('');
                        setSecureDocId(null);
                    }}
                    title="Security Check"
                    size="sm"
                >
                    <div className="space-y-4 pt-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-xl text-xs font-medium border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>This document is password protected. Please enter the valid credentials to access the content.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Document Password</label>
                            <input
                                type="password"
                                placeholder="Enter password..."
                                value={securePassword}
                                onChange={(e) => setSecurePassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsPasswordModalOpen(false);
                                    setSecurePassword('');
                                    setSecureDocId(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSecureDownloadOrView}
                                isLoading={isLoading}
                                disabled={!securePassword}
                            >
                                Unlock & Download
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </RouteGuard>
    );
};

export default DocumentsPage;
