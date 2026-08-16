'use client';

import { useState, useEffect, useCallback } from 'react';
import { documentsService } from '@/lib/api/services';
import { DocumentModel, UploadDocumentModel, GetAllDocumentsRequestModel } from '@bosvault/shared-models';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { FileText, Upload, Download, Trash2, Search, Plus, File as FileIcon, Lock, ArrowLeft, FileSpreadsheet, Image as ImageIcon, FileCode, FileArchive, Eye } from 'lucide-react';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentsMasterViewProps {
    onBack?: () => void;
}

export const DocumentsMasterView: React.FC<DocumentsMasterViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<DocumentModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<DocumentModel | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [secureDocId, setSecureDocId] = useState<number | null>(null);
    const [securePassword, setSecurePassword] = useState('');
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<DocumentModel | null>(null);

    const fetchDocuments = useCallback(async () => {
        if (!user) return;
        try {
            const req: GetAllDocumentsRequestModel = { companyId: user.companyId };
            const response = await documentsService.getAllDocuments(req);
            if (response.status) {
                setDocuments(response.documents || []);
            } else {
                AlertMessages.getErrorMessage(response.message || 'Failed to fetch documents');
            }
        } catch (error) {
            AlertMessages.getErrorMessage(error.message || 'Failed to fetch documents');
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchDocuments();
        }
    }, [fetchDocuments, user]);

    useEffect(() => {
        return () => {
            if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

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
        } catch (error) {
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
        if (mimeType.includes('image')) return <ImageIcon className={`${size} text-slate-900 dark:text-white`} />;
        if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('html'))
            return <FileCode className={`${size} text-amber-500`} />;
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive'))
            return <FileArchive className={`${size} text-purple-500`} />;
        return <FileIcon className={`${size} text-slate-400`} />;
    }, []);


    const handleDeleteClick = (doc: DocumentModel) => {
        setDocumentToDelete(doc);
        setIsDeleteModalOpen(true);
    };

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
        } catch (error) {
            AlertMessages.getErrorMessage(error.message || 'Failed to delete document');
        }
    }, [documentToDelete, fetchDocuments, user]);

    const handleDownload = useCallback(async (id: number) => {
        try {
            const doc = documents.find(d => d.id === id);

            if (doc?.isSecure) {
                setSecureDocId(id);
                setIsPasswordModalOpen(true);
                return;
            }

            const blob = await documentsService.downloadFile(id);
            const downloadBlob = new Blob([blob], { type: doc?.mimeType || blob.type });
            const url = window.URL.createObjectURL(downloadBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc ? doc.originalName : `document-${id}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            AlertMessages.getErrorMessage('Failed to download document. Please try again.');
        }
    }, [documents]);

    const handleView = useCallback(async (id: number) => {
        try {
            const doc = documents.find(d => d.id === id);

            if (doc?.isSecure) {
                setSecureDocId(id);
                setIsPasswordModalOpen(true);
                return;
            }

            const blob = await documentsService.downloadFile(id);
            const viewBlob = new Blob([blob], { type: doc?.mimeType || blob.type });
            const url = window.URL.createObjectURL(viewBlob);

            // Open in new tab
            const newWindow = window.open(url, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                // Fallback to modal if popup is blocked
                if (previewUrl) window.URL.revokeObjectURL(previewUrl);
                setPreviewUrl(url);
                setPreviewDoc(doc || null);
                setIsPreviewModalOpen(true);
            }

        } catch (error) {
            console.error('View failed:', error);
            AlertMessages.getErrorMessage('Failed to open document preview.');
        }
    }, [documents, previewUrl]);

    const handleSecureDownload = async () => {
        if (!secureDocId || !securePassword) return;
        setIsLoading(true);
        try {
            const doc = documents.find(d => d.id === secureDocId);
            const blob = await documentsService.downloadSecureDocument({ id: secureDocId, password: securePassword });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc ? doc.originalName : `document-${secureDocId}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            setIsPasswordModalOpen(false);
            setSecurePassword('');
            setSecureDocId(null);
        } catch (error) {
            console.error('Secure download failed:', error);
            AlertMessages.getErrorMessage(error?.response?.data?.message || 'Invalid password or download failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden h-[600px] flex flex-col p-0">
                <CardHeader className="p-4 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 mb-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Document Vault</h3>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto mt-3 md:mt-0">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                className="w-full pl-10 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-700 transition-all text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            {onBack && (
                                <Button size="xs" variant="primary" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                                    Back to Masters
                                </Button>
                            )}
                            <Button size="xs" variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsUploadModalOpen(true)}>
                                Upload Document
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">Document Name</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-center">Category</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-center">Size & Type</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                                {documents.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No documents found</td></tr>
                                ) : (
                                    documents.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                                                        {getFileIcon(doc.mimeType)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-slate-900 dark:text-white text-sm truncate max-w-xs">{doc.originalName}</p>
                                                            {doc.isSecure && <Lock className="w-3 h-3 text-amber-500" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border border-slate-200 dark:border-slate-700 text-center">
                                                <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700">
                                                    {doc.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border border-slate-200 dark:border-slate-700 text-center">
                                                <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{formatFileSize(doc.fileSize)}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-0.5">{doc.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                                            </td>
                                            <td className="px-6 py-4 border border-slate-200 dark:border-slate-700 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleView(doc.id)}
                                                        className="h-7 w-7 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-900 text-white transition-colors shadow-sm"
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(doc.id)}
                                                        className="h-7 w-7 flex items-center justify-center rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm"
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(doc)}
                                                        className="h-7 w-7 flex items-center justify-center rounded bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
                                                        title="Delete"
                                                    >
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
                <div className="space-y-6">
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 ${selectedFile
                            ? 'border-emerald-500/50 bg-emerald-50/10'
                            : 'border-slate-300 dark:border-slate-700 hover:border-slate-700'
                            }`}
                        onClick={() => document.getElementById('file-upload-modal')?.click()}
                    >
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload-modal"
                        />
                        <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform duration-300 ${selectedFile ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}>
                            <Upload className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                            {selectedFile ? 'File Selected' : 'Choose a file to upload'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {selectedFile ? selectedFile.name : 'Click here or drag and drop'}
                        </p>
                        {selectedFile && (
                            <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                {formatFileSize(selectedFile.size)}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="h-14"
                        />
                        <Input
                            label="Tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="h-14"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <textarea
                            placeholder="What is this document about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-slate-700 text-sm"
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
                        >
                            Upload
                        </Button>
                    </div>
                </div>
            </Modal>

            <DeleteConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDocumentToDelete(null);
                }}
                onConfirm={confirmDelete}
                itemName={documentToDelete ? documentToDelete.originalName : "Document"}
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
                <div className="space-y-4 pt-2">
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-xs font-medium border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                        <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>This document is protected. Enter password to access.</p>
                    </div>

                    <Input
                        label="Document Password"
                        type="password"
                        placeholder="Enter password..."
                        value={securePassword}
                        onChange={(e) => setSecurePassword(e.target.value)}
                        className="h-14"
                        autoFocus
                    />

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
                            onClick={handleSecureDownload}
                            isLoading={isLoading}
                            disabled={!securePassword}
                        >
                            Download
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title={`Preview: ${previewDoc?.originalName}`}
                size="xl"
            >
                <div className="flex flex-col h-[70vh]">
                    {previewUrl && previewDoc && (
                        <>
                            {previewDoc.mimeType.toLowerCase().includes('pdf') ? (
                                <iframe
                                    src={`${previewUrl}#toolbar=0`}
                                    className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                                    title="PDF Preview"
                                />
                            ) : previewDoc.mimeType.toLowerCase().includes('image') ? (
                                <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <img
                                        src={previewUrl}
                                        alt={previewDoc.originalName}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                                        {getFileIcon(previewDoc.mimeType)}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Preview not available</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
                                        We can't preview this file type directly in the browser. Please download it to view the full content.
                                    </p>
                                    <Button
                                        variant="primary"
                                        leftIcon={<Download className="h-4 w-4" />}
                                        onClick={() => handleDownload(previewDoc.id)}
                                    >
                                        Download Now
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                    <div className="flex justify-end gap-3 pt-4 mt-auto border-t border-slate-200 dark:border-slate-700">
                        <Button
                            variant="outline"
                            onClick={() => setIsPreviewModalOpen(false)}
                        >
                            Close
                        </Button>
                        {previewDoc && (
                            <Button
                                variant="success"
                                leftIcon={<Download className="h-4 w-4" />}
                                onClick={() => handleDownload(previewDoc.id)}
                            >
                                Download
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};
