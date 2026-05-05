'use client';

import { useState, useRef } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import * as XLSX from 'xlsx';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { EmployeesService } from '@bosvault/shared-services';

interface EmployeeBulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: number;
    onSuccess: () => void;
}

interface EmployeeBulkImportModalProps {
    children?: React.ReactNode;
}

export const EmployeeBulkImportModal: React.FC<EmployeeBulkImportModalProps> = ({ isOpen, onClose, companyId, onSuccess }: EmployeeBulkImportModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; successCount: number; errorCount: number; errors: { row: number; error: string }[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const employeeService = new EmployeesService();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setImportResult(null);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'First Name', 'Last Name', 'Email', 'Phone',
            'Department (ID or Name)', 'Status (active/inactive)',
            'Billing Amount', 'Remarks',
            'Reporting Manager (ID, Email, or Full Name)',
            'Company Name (optional - for validation)'
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Employee_Import_Template.xlsx');
    };

    const handleUpload = async () => {
        if (!file) {
            AlertMessages.getErrorMessage('Please select a file to import.');
            return;
        }
        if (!companyId) {
            AlertMessages.getErrorMessage('No company selected. Please select an organization first.');
            return;
        }

        try {
            const userData = localStorage.getItem('user');
            const userId = userData ? JSON.parse(userData).id : 1;
            const response = await employeeService.bulkImport(file, companyId, userId);

            if (response.status) {
                setImportResult({ success: true, message: response.message, successCount: response.successCount, errorCount: response.errorCount, errors: response.errors });
                if (response.errorCount === 0) {
                    AlertMessages.getSuccessMessage(response.message);
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 2000);
                } else {
                    AlertMessages.getErrorMessage(response.message);
                    if (response.successCount > 0) {
                        onSuccess();
                    }
                }
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message);
        }
    };

    const resetSelection = () => {
        setFile(null);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bulk Import Employees"
            size="lg"
        >
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold mb-2 text-slate-800 dark:text-slate-200">Instructions:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li>Download the template and fill in employee details.</li>
                    </ul>
                    <div className="mt-4">
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={handleDownloadTemplate}
                        >
                            Download Template
                        </Button>
                    </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center transition-colors hover:border-indigo-500 dark:hover:border-indigo-400">
                    <input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                        id="file-upload"
                    />

                    {!file ? (
                        <label htmlFor="file-upload" className="cursor-pointer block">
                            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-slate-900 dark:text-white">Click to upload or drag and drop</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Excel or CSV files only</p>
                        </label>
                    ) : (
                        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                    <FileUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-slate-900 dark:text-white">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button onClick={resetSelection} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                    )}
                </div>

                {importResult && (
                    <div className={`p-4 rounded-lg border ${importResult.errorCount > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50' : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/50'}`}>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {importResult.errorCount > 0 ? (
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                ) : (
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-semibold mb-1 ${importResult.errorCount > 0 ? 'text-red-900 dark:text-red-200' : 'text-green-900 dark:text-green-200'}`}>
                                    {importResult.message}
                                </h4>
                                {importResult.errorCount > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto">
                                        <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">Errors:</p>
                                        <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-1">
                                            {importResult.errors.map((err, idx) => (
                                                <li key={idx}>Row {err.row}: {err.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpload}
                    >
                        Import Employees
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
