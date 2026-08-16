'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AssetStatusEnum, ComplianceStatusEnum, EncryptionStatusEnum } from '@bosvault/shared-models';
import { assetService, companyService, deviceConfigService, assetTypeService } from '@/lib/api/services';
import { useToast } from '@/contexts/ToastContext';

import { Asset, OptionItem } from '../types';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset?: Asset | null;
    onSuccess: () => void;
    children?: React.ReactNode;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({ isOpen, onClose, asset, onSuccess }: AssetFormModalProps) => {
    const { success, error: toastError } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [companies, setCompanies] = useState<OptionItem[]>([]);
    const [deviceConfigs, setDeviceConfigs] = useState<OptionItem[]>([]);
    const [assetTypes, setAssetTypes] = useState<OptionItem[]>([]);
    const [formData, setFormData] = useState({ deviceId: '', deviceConfigId: '', model: '', serialNumber: '', configuration: '', companyId: '', assetStatusEnum: AssetStatusEnum.AVAILABLE, purchaseDate: '', warrantyExpiry: '', boxNo: '', complianceStatus: ComplianceStatusEnum.UNKNOWN, encryptionStatus: EncryptionStatusEnum.ENCRYPTED, storageAvailable: '', assignedToEmployeeId: undefined as number | undefined, previousUserEmployeeId: undefined as number | undefined });

    const getCompanyId = useCallback((): number => {
        const storedUser = localStorage.getItem('auth_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        return user?.companyId || 1;
    }, []);

    const fetchDeviceConfigs = useCallback(async () => {
        try {
            const response = await deviceConfigService.getAllDeviceConfigs();
            if (response.status) {
                setDeviceConfigs(response.deviceConfigs || []);
            }
        } catch (error) {
            console.error('Failed to fetch device configurations:', error);
        }
    }, [getCompanyId]);

    const fetchAssetTypes = useCallback(async () => {
        try {
            const response = await assetTypeService.getAllAssetTypesDropdown();
            if (response.status) {
                setAssetTypes(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch asset types:', error);
        }
    }, []);

    const fetchCompanies = useCallback(async () => {
        try {
            const response = await companyService.getAllCompanies();
            if (response.status) {
                // FIXED: API returns 'data' array, not 'companies'
                setCompanies(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchDeviceConfigs();
            fetchAssetTypes();
            fetchCompanies();

            if (asset) {
                setFormData({
                    deviceId: asset.deviceId?.toString() || '',
                    deviceConfigId: asset.deviceConfigId?.toString() || '',
                    model: asset.model || '',
                    serialNumber: asset.serialNumber || '',
                    configuration: asset.configuration || '',
                    companyId: asset.companyId?.toString() || '',
                    assetStatusEnum: (asset.assetStatusEnum || asset.status || AssetStatusEnum.AVAILABLE) as AssetStatusEnum,
                    purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
                    warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
                    boxNo: asset.boxNo || '',
                    complianceStatus: (asset.complianceStatus || ComplianceStatusEnum.UNKNOWN) as ComplianceStatusEnum,
                    encryptionStatus: (asset.encryptionStatus || EncryptionStatusEnum.UNKNOWN) as EncryptionStatusEnum,
                    storageAvailable: asset.storageAvailable || '',
                    assignedToEmployeeId: asset.assignedToEmployeeId ? Number(asset.assignedToEmployeeId) : undefined,
                    previousUserEmployeeId: asset.previousUserEmployeeId ? Number(asset.previousUserEmployeeId) : undefined
                });
            } else {
                setFormData({
                    deviceId: '',
                    deviceConfigId: '',
                    model: '',
                    serialNumber: '',
                    configuration: '',
                    companyId: '',
                    assetStatusEnum: AssetStatusEnum.AVAILABLE,
                    purchaseDate: new Date().toISOString().split('T')[0],
                    warrantyExpiry: '',
                    boxNo: '',
                    complianceStatus: ComplianceStatusEnum.UNKNOWN,
                    encryptionStatus: EncryptionStatusEnum.UNKNOWN,
                    storageAvailable: '',
                    assignedToEmployeeId: undefined,
                    previousUserEmployeeId: undefined
                });
            }
        }
    }, [isOpen, asset, fetchDeviceConfigs, fetchAssetTypes, fetchCompanies]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'deviceId') {
                updated.deviceConfigId = '';
                updated.configuration = '';
            }
            if (name === 'deviceConfigId') {
                const selectedConfig = deviceConfigs.find(dc => dc.id.toString() === value);
                if (selectedConfig) {
                    let configText = selectedConfig.configuration || '';
                    const extraParts: string[] = [];
                    if (selectedConfig.ram) extraParts.push(`RAM: ${selectedConfig.ram}`);
                    if (selectedConfig.storage) extraParts.push(`Storage: ${selectedConfig.storage}`);
                    if (extraParts.length > 0) {
                        configText = configText ? `${configText} (${extraParts.join(', ')})` : extraParts.join(', ');
                    }
                    updated.configuration = configText;
                }
            }
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                deviceId: Number(formData.deviceId),
                deviceConfigId: formData.deviceConfigId ? Number(formData.deviceConfigId) : undefined,
                companyId: Number(formData.companyId),
                id: asset?.id
            };

            const response = asset
                ? await assetService.updateAsset(payload as unknown as Parameters<typeof assetService.updateAsset>[0])
                : await assetService.createAsset(payload as unknown as Parameters<typeof assetService.createAsset>[0]);

            if (response.status) {
                success('Success', asset ? 'Asset updated successfully' : 'Asset created successfully');
                onSuccess();
                onClose();
            } else {
                toastError('Error', response.message || 'Operation failed');
            }
        } catch (error) {
            toastError('Error', error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedAssetType = assetTypes.find(t => t.id.toString() === formData.deviceId);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={asset ? 'Update Asset' : 'Add New Asset'}
            size="2xl"
        >
            <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4">
                {/* Details Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select
                        label="Company"
                        name="companyId"
                        value={formData.companyId}
                        onChange={handleChange}
                        options={[
                            { value: '', label: 'Select Company' },
                            ...companies.map(c => ({ value: c.id, label: c.companyName }))
                        ]}
                        required
                    />
                    <Select
                        label="Asset Type"
                        name="deviceId"
                        value={formData.deviceId}
                        onChange={handleChange}
                        options={[
                            { value: '', label: 'Select Type' },
                            ...assetTypes.map(t => ({ value: t.id, label: t.name }))
                        ]}
                        required
                    />
                    <Select
                        label="Device Configuration"
                        name="deviceConfigId"
                        value={formData.deviceConfigId}
                        onChange={handleChange}
                        options={[
                            { value: '', label: 'Select Configuration' },
                            ...(selectedAssetType
                                ? deviceConfigs.filter(dc => dc.assetType?.toLowerCase() === selectedAssetType.name?.toLowerCase())
                                : deviceConfigs
                            ).map(b => ({ value: b.id, label: b.name }))
                        ]}
                    />
                </div>

                {/* Details Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                        label="Serial Number"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        required
                    />
                    <Select
                        label="Status"
                        name="assetStatusEnum"
                        value={formData.assetStatusEnum}
                        onChange={handleChange}
                        options={[
                            { value: AssetStatusEnum.AVAILABLE, label: 'Available' },
                            { value: AssetStatusEnum.IN_USE, label: 'In Use' },
                            { value: AssetStatusEnum.MAINTENANCE, label: 'Maintenance' },
                            { value: AssetStatusEnum.RETIRED, label: 'Retired' }
                        ]}
                    />
                </div>

                {/* Details Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                        label="Purchase Date"
                        name="purchaseDate"
                        type="date"
                        value={formData.purchaseDate}
                        onChange={handleChange}
                    />
                    <Input
                        label="Warranty Expiry"
                        name="warrantyExpiry"
                        type="date"
                        value={formData.warrantyExpiry}
                        onChange={handleChange}
                    />
                </div>

                {/* Configuration */}
                <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Configuration Details
                    </label>
                    <textarea
                        name="configuration"
                        value={formData.configuration}
                        onChange={handleChange}
                        rows={2}
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
                        {asset ? 'Update Asset' : 'Create Asset'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
