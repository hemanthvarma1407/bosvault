'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AssetStatusEnum } from '@bosvault/shared-models';
import { deviceConfigService, assetTypeService } from '@/lib/api/services';
import { OptionItem } from '../types';
import { AlertMessages } from '@/lib/utils/AlertMessages';

export interface AssetFilterState {
    deviceConfigIds: (string | number)[];
    assetTypeIds: (string | number)[];
    statusFilter: AssetStatusEnum[];
    purchaseDateFrom: string;
    purchaseDateTo: string;
}

interface AdvancedFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: AssetFilterState) => void;
    initialFilters: Partial<AssetFilterState>;
    children?: React.ReactNode;
}


export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({ isOpen, onClose, onApply, initialFilters }: AdvancedFilterModalProps) => {
    const [deviceConfigs, setDeviceConfigs] = useState<OptionItem[]>([]);
    const [assetTypes, setAssetTypes] = useState<OptionItem[]>([]);
    const [localFilters, setLocalFilters] = useState<AssetFilterState>({ deviceConfigIds: [], assetTypeIds: [], statusFilter: [], purchaseDateFrom: '', purchaseDateTo: '' });

    const fetchDeviceConfigs = useCallback(async () => {
        try {
            const response = await deviceConfigService.getAllDeviceConfigs();
            if (response.status) {
                setDeviceConfigs(response.deviceConfigs || []);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (error) {
            AlertMessages.getErrorMessage(error.message);
        }
    }, []);

    const fetchAssetTypes = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters({
                deviceConfigIds: initialFilters.deviceConfigIds || [],
                assetTypeIds: initialFilters.assetTypeIds || [],
                statusFilter: initialFilters.statusFilter || [],
                purchaseDateFrom: initialFilters.purchaseDateFrom || '',
                purchaseDateTo: initialFilters.purchaseDateTo || ''
            });
            fetchDeviceConfigs();
            fetchAssetTypes();
        }
    }, [isOpen, initialFilters, fetchDeviceConfigs, fetchAssetTypes]);

    const handleStatusToggle = (status: AssetStatusEnum) => {
        setLocalFilters((prev: AssetFilterState) => {
            const current = prev.statusFilter || [];
            if (current.includes(status)) {
                return { ...prev, statusFilter: current.filter((s: AssetStatusEnum) => s !== status) };
            } else {
                return { ...prev, statusFilter: [...current, status] };
            }
        });
    };

    const handleDeviceConfigToggle = (id: number | string) => {
        setLocalFilters((prev: AssetFilterState) => {
            const current = prev.deviceConfigIds || [];
            if (current.includes(id)) {
                return { ...prev, deviceConfigIds: current.filter((i: number | string) => i !== id) };
            } else {
                return { ...prev, deviceConfigIds: [...current, id] };
            }
        });
    };

    const handleTypeToggle = (id: number | string) => {
        setLocalFilters((prev: AssetFilterState) => {
            const current = prev.assetTypeIds || [];
            if (current.includes(id)) {
                return { ...prev, assetTypeIds: current.filter((i: number | string) => i !== id) };
            } else {
                return { ...prev, assetTypeIds: [...current, id] };
            }
        });
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleClear = () => {
        setLocalFilters({
            deviceConfigIds: [],
            assetTypeIds: [],
            statusFilter: [],
            purchaseDateFrom: '',
            purchaseDateTo: ''
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Advanced Filters" size="lg">
            <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Status Section */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Status</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(AssetStatusEnum).map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusToggle(status)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                    ${localFilters.statusFilter?.includes(status)
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}
                                `}
                            >
                                {localFilters.statusFilter?.includes(status) && <Check className="h-3 w-3" />}
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Asset Types Section */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Asset Types</h3>
                    <div className="flex flex-wrap gap-2">
                        {assetTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => handleTypeToggle(type.id)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                    ${localFilters.assetTypeIds?.includes(type.id)
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}
                                `}
                            >
                                {localFilters.assetTypeIds?.includes(type.id) && <Check className="h-3 w-3" />}
                                {type.name || type.deviceName}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Device Configurations Section */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Device Configurations</h3>
                    <div className="flex flex-wrap gap-2">
                        {deviceConfigs.map((config) => (
                            <button
                                key={config.id}
                                onClick={() => handleDeviceConfigToggle(config.id)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                    ${localFilters.deviceConfigIds?.includes(config.id)
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}
                                `}
                            >
                                {localFilters.deviceConfigIds?.includes(config.id) && <Check className="h-3 w-3" />}
                                {config.name || config.laptopCompany}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Range Section */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Purchase Date</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">From</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                value={localFilters.purchaseDateFrom}
                                onChange={(e) => setLocalFilters({ ...localFilters, purchaseDateFrom: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">To</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                value={localFilters.purchaseDateTo}
                                onChange={(e) => setLocalFilters({ ...localFilters, purchaseDateTo: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center rounded-b-xl">
                <button
                    onClick={handleClear}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                >
                    Clear All Filters
                </button>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="px-6">
                        Cancel
                    </Button>
                    <Button onClick={handleApply} className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                        Apply Filters
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
