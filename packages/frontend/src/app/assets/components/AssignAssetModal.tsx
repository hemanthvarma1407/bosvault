import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { assetService, employeeService } from '@/lib/api/services';
import { AssignAssetOpRequestModel, ReturnAssetOpRequestModel, AssetStatusEnum, GetAllEmployeesRequestModel } from '@bosvault/shared-models';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { useAuth } from '@/contexts/AuthContext';

import { Asset, EmployeeOption } from '../types';

interface AssignAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset | null;
    onSuccess: () => void;
    children?: React.ReactNode;
}

export const AssignAssetModal: React.FC<AssignAssetModalProps> = ({ isOpen, onClose, asset, onSuccess }: AssignAssetModalProps) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);

    const [actionType, setActionType] = useState<'reassign' | 'return' | 'maintenance' | 'retired'>('reassign');
    const [formData, setFormData] = useState({
        employeeId: '',
        assignedDate: new Date().toISOString().split('T')[0],
        remarks: ''
    });

    const fetchEmployees = useCallback(async () => {
        const targetCompanyId = Number(asset?.companyId ?? user?.companyId);
        try {
            const response = await employeeService.getAllEmployees(new GetAllEmployeesRequestModel(targetCompanyId));
            if (response.status) {
                setEmployees(response.data || []);
            }
        } catch (err) {
            AlertMessages.getErrorMessage(err.message || 'Failed to fetch employees');
        }
    }, [user?.companyId, asset?.companyId]);

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
            setActionType('reassign');
            setFormData({
                employeeId: '',
                assignedDate: new Date().toISOString().split('T')[0],
                remarks: ''
            });
        }
    }, [isOpen, fetchEmployees]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!user?.id) {
            AlertMessages.getErrorMessage('User session not found');
            setIsLoading(false);
            return;
        }

        try {
            if (actionType === 'reassign') {
                const req = new AssignAssetOpRequestModel(
                    Number(asset!.id),
                    Number(formData.employeeId),
                    user.id,
                    formData.remarks,
                    formData.assignedDate ? new Date(formData.assignedDate) : undefined
                );
                const response = await assetService.assignAssetOp(req);

                if (response.status) {
                    AlertMessages.getSuccessMessage('Asset assigned successfully');
                    onSuccess();
                    onClose();
                } else {
                    AlertMessages.getErrorMessage(response.message || 'Failed to assign asset');
                }
            } else {
                // Handling Return, Maintenance, Retired
                let targetStatus = AssetStatusEnum.AVAILABLE;
                if (actionType === 'maintenance') targetStatus = AssetStatusEnum.MAINTENANCE;
                if (actionType === 'retired') targetStatus = AssetStatusEnum.RETIRED;

                const req = new ReturnAssetOpRequestModel(
                    Number(asset!.id),
                    user.id,
                    formData.remarks,
                    targetStatus
                );

                const response = await assetService.returnAssetOp(req);
                if (response.status) {
                    AlertMessages.getSuccessMessage('Asset status updated successfully');
                    onSuccess();
                    onClose();
                } else {
                    AlertMessages.getErrorMessage(response.message || 'Failed to update asset');
                }
            }
        } catch (error) {
            AlertMessages.getErrorMessage('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign Asset: ${asset?.assetName || ''}`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Action Type Selection (Only for already assigned functionality) */}
                {(asset?.assignedToEmployeeId || asset?.assetStatusEnum === AssetStatusEnum.IN_USE) && (
                    <div>
                        <Select
                            label="Action"
                            name="actionType"
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value as 'reassign' | 'return' | 'maintenance' | 'retired')}
                            options={[
                                { value: 'reassign', label: 'Reassign to Employee' },
                                { value: 'return', label: 'Return to Store' },
                                { value: 'maintenance', label: 'Move to Maintenance' },
                                { value: 'retired', label: 'Mark as Retired' }
                            ]}
                            required
                        />
                    </div>
                )}

                {actionType === 'reassign' && (
                    <>
                        {/* Employee Selection */}
                        <div>
                            <Select
                                label="Assign To Employee"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                options={[
                                    { value: '', label: 'Select Employee' },
                                    ...employees.map(e => ({
                                        value: e.id,
                                        label: `${e.firstName} ${e.lastName}${e.managerName ? ` (Mgr: ${e.managerName})` : ''}`
                                    }))
                                ]}
                                required={actionType === 'reassign'}
                            />
                        </div>

                        {/* Assignment Date */}
                        <div>
                            <Input
                                label="Assignment Date"
                                name="assignedDate"
                                type="date"
                                value={formData.assignedDate}
                                onChange={handleChange}
                                required={actionType === 'reassign'}
                            />
                        </div>

                    </>
                )}

                {/* Remarks */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Remarks (Optional)
                    </label>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-11"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading}
                        className="flex-1 h-11"
                    >
                        Confirm
                    </Button>
                </div>
            </form>
        </Modal >
    );
}
