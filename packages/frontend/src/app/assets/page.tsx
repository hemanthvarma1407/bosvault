'use client';

import React, { useState } from 'react';
import { Package, Warehouse, History, Plus, Filter, Activity, CheckCircle2, User, RefreshCw, Building2, Search, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { ModernTabs } from './components/ModernTabs';
import { AllAssetsTab } from './components/AllAssetsTab';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/ui/PageHeader';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserRoleEnum, AssetSearchRequestModel, IdRequestModel } from '@bosvault/shared-models';
import { usePermissions } from '@/hooks/usePermissions';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { assetService, companyService } from '@/lib/api/services';
import { AlertMessages } from '@/lib/utils/AlertMessages';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useAppSelector } from '@/store';

const AssetQRModal = dynamic(() => import('./components/AssetQRModal').then(mod => mod.AssetQRModal), { ssr: false });
const AssetTimelineModal = dynamic(() => import('./components/AssetTimelineModal').then(mod => mod.AssetTimelineModal), { ssr: false });
const BulkImportModal = dynamic(() => import('./components/BulkImportModal').then(mod => mod.BulkImportModal), { ssr: false });
const AdvancedFilterModal = dynamic(() => import('./components/AdvancedFilterModal').then(mod => mod.AdvancedFilterModal), { ssr: false });
const AssetFormModal = dynamic(() => import('./components/AssetFormModal').then(mod => mod.AssetFormModal), { ssr: false });
const AssignAssetModal = dynamic(() => import('./components/AssignAssetModal').then(mod => mod.AssignAssetModal), { ssr: false });


interface Asset {
    id: number;
    assetName: string;
    assetType?: string;
    serialNumber?: string;
    companyId: number;
    deviceId?: number;
    deviceConfigId?: number;
    model?: string;
    configuration?: string;
    status?: string;
    purchaseDate?: string;
    warrantyExpiry?: string;
    createdAt?: string;
    assignedTo?: string;
    assignedDate?: string;
    userAssignedDate?: string;
    lastReturnDate?: string;
    assignedToEmployeeId?: number;
    previousUserEmployeeId?: number;
    previousUser?: string;
    managerName?: string;
}

interface AssetStatistics {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    retired: number;
}

const AssetsPage: React.FC = () => {
    const { hasRole } = usePermissions();
    const canAssign = hasRole([UserRoleEnum.ASSET_ADMIN]);
    const reduxCompanyId = useAppSelector((state) => state.company.selectedCompanyId);
    const [companies, setCompanies] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('store');

    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    const [assets, setAssets] = useState<Asset[]>([]);
    const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchCompanies = React.useCallback(async () => {
        try {
            const response: any = await companyService.getAllCompanies();
            if (response.status) {
                setCompanies(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    }, []);

    const fetchAssets = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const compId = reduxCompanyId ? Number(reduxCompanyId) : 0;
            const req = new IdRequestModel(compId);
            const response = await assetService.getAssetsWithAssignments(req);
            if (response.status) {
                const data = (response as any).assets || [];
                const mappedAssets: Asset[] = data.map((item: any) => ({
                    id: item.id,
                    assetName: item.deviceName || `Asset ${item.serialNumber}`,
                    assetType: item.deviceType || 'Unknown',
                    serialNumber: item.serialNumber,
                    companyId: item.companyId,
                    deviceId: item.deviceId || item.device_id,
                    deviceConfigId: item.deviceConfigId || item.device_config_id,
                    model: item.model,
                    configuration: item.configuration,
                    status: (item.assetStatusEnum || item.status || 'available').toString().toLowerCase(),
                    purchaseDate: item.purchaseDate,
                    warrantyExpiry: item.warrantyExpiry,
                    createdAt: item.createdAt || item.created_at,
                    assignedTo: item.assignedTo?.trim() || undefined,
                    assignedDate: item.assignedDate,
                    userAssignedDate: item.userAssignedDate,
                    lastReturnDate: item.lastReturnDate,
                    assignedToEmployeeId: item.assignedToEmployeeId,
                    previousUserEmployeeId: item.previousUserEmployeeId,
                    previousUser: item.previousUser,
                    managerName: item.managerName?.trim() || undefined
                }));
                setAssets(mappedAssets);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'An error occurred while fetching assets');
        } finally {
            setIsLoading(false);
        }
    }, [reduxCompanyId]);

    const fetchStatistics = React.useCallback(async () => {
        try {
            const compId = reduxCompanyId ? Number(reduxCompanyId) : 0;
            const req = new IdRequestModel(compId);
            const response = await assetService.getAssetStatistics(req);
            if (response.status) {
                setStatistics(response.statistics);
            }
        } catch (err: any) {
            console.error('Failed to fetch statistics:', err);
        }
    }, [reduxCompanyId]);


    const refresh = React.useCallback(() => {
        fetchAssets();
        fetchStatistics();
    }, [fetchAssets, fetchStatistics]);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    React.useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    React.useEffect(() => {
        if (fetchError) {
            AlertMessages.getErrorMessage(fetchError);
            setFetchError(null);
        }
    }, [fetchError]);

    const searchAssets = React.useCallback(async (filters: any) => {
        setIsLoading(true);
        try {
            const compId = reduxCompanyId ? Number(reduxCompanyId) : 0;
            const request = new AssetSearchRequestModel(
                compId,
                filters.searchQuery,
                filters.statusFilter,
                filters.deviceConfigIds,
                filters.assetTypeIds,
                filters.employeeId,
                filters.purchaseDateFrom,
                filters.purchaseDateTo
            );
            const response = await assetService.searchAssets(request);
            if (response.status) {
                const data = (response as any).assets || [];
                const mappedAssets: Asset[] = data.map((item: any) => ({
                    id: item.id,
                    assetName: item.deviceName || `Asset ${item.serialNumber}`,
                    assetType: item.deviceType || 'Unknown',
                    serialNumber: item.serialNumber,
                    companyId: item.companyId,
                    deviceId: item.deviceId || item.device_id,
                    deviceConfigId: item.deviceConfigId || item.device_config_id,
                    model: item.model,
                    configuration: item.configuration,
                    status: (item.assetStatusEnum || item.status || 'available').toString().toLowerCase(),
                    purchaseDate: item.purchaseDate,
                    warrantyExpiry: item.warrantyExpiry,
                    createdAt: item.createdAt || item.created_at,
                    assignedTo: item.assignedTo?.trim() || undefined,
                    assignedDate: item.assignedDate,
                    userAssignedDate: item.userAssignedDate,
                    lastReturnDate: item.lastReturnDate,
                    assignedToEmployeeId: item.assignedToEmployeeId,
                    previousUserEmployeeId: item.previousUserEmployeeId,
                    previousUser: item.previousUser,
                    managerName: item.managerName?.trim() || undefined
                }));
                setAssets(mappedAssets);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to search assets');
        } finally {
            setIsLoading(false);
        }
    }, [reduxCompanyId]);


    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const tabs = [
        { id: 'store', label: 'Store Assets', icon: Warehouse, gradient: 'from-emerald-500 to-teal-500' },
        { id: 'assigned', label: 'Assigned Assets', icon: User, gradient: 'from-slate-900 to-slate-900' },
        { id: 'maintenance', label: 'Maintenance Assets', icon: RefreshCw, gradient: 'from-orange-500 to-amber-500' },
        { id: 'not_used', label: 'Not Used Assets', icon: History, gradient: 'from-slate-500 to-gray-500' }
    ];

    const handleEdit = (asset: any) => {
        setSelectedAsset(asset);
        setIsAssetFormOpen(true);
    };

    const handleAddAsset = () => {
        setSelectedAsset(null);
        setIsAssetFormOpen(true);
    };

    const handleAssign = (asset: any) => {
        setSelectedAsset(asset);
        setIsAssignModalOpen(true);
    };

    const handleView = (asset: any) => {
        setSelectedAsset(asset);
        setIsViewModalOpen(true);
    };

    const handleDelete = (asset: any) => {
        setSelectedAsset(asset);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedAsset) return;
        try {
            const response = await assetService.deleteAsset({ id: selectedAsset.id });
            if (response.status) {
                AlertMessages.getSuccessMessage('Asset deleted successfully');
                refresh();
                setIsDeleteModalOpen(false);
                setSelectedAsset(null);
            } else {
                AlertMessages.getErrorMessage(response.message);
            }
        } catch (err: any) {
            AlertMessages.getErrorMessage(err.message || 'Failed to delete asset');
        }
    };

    const handlePrint = (asset: any) => {
        setSelectedAsset(asset);
        setIsQRModalOpen(true);
    };

    const handleHistory = (asset: any) => {
        setSelectedAsset(asset);
        setIsTimelineModalOpen(true);
    };

    const StatCard = ({ label, value, icon, gradient, trend }: any) => (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900 group">
            <CardContent className="p-4 relative">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 opacity-90">{label}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{value || 0}</h3>
                            {trend && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                                    {trend}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`p-2 rounded-lg sm:p-2.5 sm:rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                        {React.cloneElement(icon, { className: 'h-5 w-5' })}
                    </div>
                </div>

                {/* Decorative background blur */}
                <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full opacity-[0.03] blur-xl group-hover:opacity-[0.08] transition-opacity duration-300`}></div>
            </CardContent>
        </Card>
    );

    return (
        <RouteGuard requiredRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]}>
            <div className="p-3 sm:p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-950/50 space-y-6 sm:space-y-8">
                <PageHeader
                    title="Asset Inventory"
                    description="Track and manage company hardware"
                    icon={<Package />}
                    gradient="from-slate-900 to-slate-900"
                    actions={[
                        {
                            label: 'Bulk Import',
                            onClick: () => setIsBulkImportOpen(true),
                            icon: <Upload className="h-3.5 w-3.5" />,
                            variant: 'outline'
                        },
                        {
                            label: 'Filter',
                            onClick: () => setIsFilterModalOpen(true),
                            icon: <Filter className="h-3.5 w-3.5" />,
                            variant: 'outline'
                        },
                        {
                            label: 'Add Asset',
                            onClick: handleAddAsset,
                            icon: <Plus className="h-3.5 w-3.5" />,
                            variant: 'primary'
                        }
                    ]}
                />

                {/* Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                    <StatCard
                        label="Total Inventory"
                        value={statistics?.total}
                        icon={<Package className="h-6 w-6" />}
                        gradient="from-slate-900 to-slate-900"
                    />
                    <StatCard
                        label="Assigned Assets"
                        value={statistics?.inUse}
                        icon={<Activity className="h-6 w-6" />}
                        gradient="from-emerald-500 to-teal-600"
                    />
                    <StatCard
                        label="Available Stock"
                        value={statistics?.available}
                        icon={<CheckCircle2 className="h-6 w-6" />}
                        gradient="from-emerald-500 to-teal-600"
                    />
                    <StatCard
                        label="Under Maintenance"
                        value={statistics?.maintenance}
                        icon={<RefreshCw className="h-6 w-6" />}
                        gradient="from-orange-500 to-amber-600"
                    />
                    <StatCard
                        label="Inactive Inventory"
                        value={statistics?.retired}
                        icon={<History className="h-6 w-6" />}
                        gradient="from-slate-500 to-gray-600"
                    />
                </div>

                <ModernTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange}>
                    <div className="mt-6">
                        {activeTab === 'store' && (
                            <AllAssetsTab
                                assets={assets}
                                isLoading={isLoading}
                                status="available"
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onPrint={handlePrint}
                                onHistory={handleHistory}
                                onAssign={handleAssign}
                                onView={handleView}
                                canAssign={canAssign}
                            />
                        )}
                        {activeTab === 'assigned' && (
                            <AllAssetsTab
                                assets={assets}
                                isLoading={isLoading}
                                status="in_use"
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onPrint={handlePrint}
                                onHistory={handleHistory}
                                onAssign={handleAssign}
                                onView={handleView}
                                canAssign={canAssign}
                            />
                        )}
                        {activeTab === 'maintenance' && (
                            <AllAssetsTab
                                assets={assets}
                                isLoading={isLoading}
                                status="maintenance"
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onPrint={handlePrint}
                                onHistory={handleHistory}
                                onAssign={handleAssign}
                                onView={handleView}
                                canAssign={canAssign}
                            />
                        )}
                        {activeTab === 'not_used' && (
                            <AllAssetsTab
                                assets={assets}
                                isLoading={isLoading}
                                status="retired"
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onPrint={handlePrint}
                                onHistory={handleHistory}
                                onAssign={handleAssign}
                                onView={handleView}
                                canAssign={canAssign}
                            />
                        )}
                    </div>
                </ModernTabs>


                {/* Modals */}
                {isQRModalOpen && (
                    <AssetQRModal
                        isOpen={isQRModalOpen}
                        asset={selectedAsset}
                        onClose={() => setIsQRModalOpen(false)}
                    />
                )}
                {isTimelineModalOpen && (
                    <AssetTimelineModal
                        isOpen={isTimelineModalOpen}
                        asset={selectedAsset}
                        companyId={Number(reduxCompanyId) || 0}
                        onClose={() => setIsTimelineModalOpen(false)}
                    />
                )}
                {isBulkImportOpen && (
                    <BulkImportModal
                        isOpen={isBulkImportOpen}
                        companyId={Number(reduxCompanyId) || 0}
                        companies={companies}
                        onSuccess={() => { refresh(); }}
                        onClose={() => setIsBulkImportOpen(false)}
                    />
                )}
                {isFilterModalOpen && (
                    <AdvancedFilterModal
                        isOpen={isFilterModalOpen}
                        initialFilters={{}}
                        onClose={() => setIsFilterModalOpen(false)}
                        onApply={(filters) => {
                            searchAssets(filters);
                            setIsFilterModalOpen(false);
                        }}
                    />
                )}
                {isAssetFormOpen && (
                    <AssetFormModal
                        isOpen={isAssetFormOpen}
                        asset={selectedAsset}
                        onClose={() => setIsAssetFormOpen(false)}
                        onSuccess={() => {
                            refresh();
                        }}
                    />
                )}
                {isAssignModalOpen && (
                    <AssignAssetModal
                        isOpen={isAssignModalOpen}
                        asset={selectedAsset}
                        onClose={() => setIsAssignModalOpen(false)}
                        onSuccess={() => {
                            refresh();
                        }}
                    />

                )}
                {isViewModalOpen && (
                    <Modal
                        isOpen={isViewModalOpen}
                        onClose={() => setIsViewModalOpen(false)}
                        title="Asset Configuration Details"
                        size="md"
                    >
                        <div className="space-y-4 p-2">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 italic">Technical Specifications</h4>
                                <div className="space-y-3">
                                    {selectedAsset?.configuration ? (
                                        <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-black/20 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                                            {selectedAsset.configuration}
                                        </pre>
                                    ) : (
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-black/20 p-4 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                            <p className="font-bold mb-1">Standard {selectedAsset?.assetType || 'Asset'} Specs</p>
                                            <p className="text-[10px] opacity-75">Model: {selectedAsset?.model || 'Generic'}</p>
                                            <p className="text-[10px] opacity-75">S/N: {selectedAsset?.serialNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="primary" onClick={() => setIsViewModalOpen(false)}>Close Details</Button>
                            </div>
                        </div>
                    </Modal>
                )}
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedAsset(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Delete Asset"
                    itemName={selectedAsset ? selectedAsset.assetName : undefined}
                    description="Are you sure you want to delete this asset? This action cannot be undone."
                />
            </div>
        </RouteGuard>
    );
}

export default AssetsPage;