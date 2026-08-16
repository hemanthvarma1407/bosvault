'use client';

import React, { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Package, LayoutGrid, Table } from 'lucide-react';
import { AssetCard } from './AssetCard';
import { AssetTable } from './AssetTable';
import { Asset } from '../types';

interface AllAssetsTabProps {
    assets: Asset[];
    isLoading: boolean;
    status?: string;
    onEdit: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
    onPrint: (asset: Asset) => void;
    onHistory: (asset: Asset) => void;
    onAssign: (asset: Asset) => void;
    onView: (asset: Asset) => void;
    canAssign?: boolean;
}

export const AllAssetsTab: React.FC<AllAssetsTabProps> = ({ assets, isLoading, status, onEdit, onDelete, onPrint, onHistory, onAssign, onView, canAssign = false }: AllAssetsTabProps) => {
    const [viewType, setViewType] = useState<'card' | 'table'>('card');

    const handleViewTypeChange = (type: 'card' | 'table') => {
        setViewType(type);
    };

    console.log(`AllAssetsTab[${status}] received ${assets?.length} assets`);

    const filteredAssets = status
        ? assets.filter(a => {
            const assetStatus = (a.status || '').toString().toLowerCase();
            const targetStatus = status.toLowerCase();
            const match = assetStatus === targetStatus ||
                (targetStatus === 'available' && assetStatus === 'available') ||
                (targetStatus === 'in_use' && (assetStatus === 'in_use' || assetStatus === 'inuse')) ||
                (targetStatus === 'maintenance' && assetStatus === 'maintenance') ||
                (targetStatus === 'retired' && assetStatus === 'retired');

            return match;
        }) : assets;

    if (isLoading) return (
        <div className="flex justify-center py-10">
            <Spinner size="lg" />
        </div>
    );

    if (filteredAssets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-6 mb-4">
                    <Package className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Assets Found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                    No assets are currently registered in the system.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Premium View Toggle Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Showing {filteredAssets.length} {filteredAssets.length === 1 ? 'Asset' : 'Assets'}
                </span>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                    <button
                        onClick={() => handleViewTypeChange('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewType === 'table'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white dark:text-slate-300 shadow-sm border border-slate-200/30 dark:border-slate-800/30'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <Table className="h-3.5 w-3.5" />
                        <span>Table View</span>
                    </button>
                    <button
                        onClick={() => handleViewTypeChange('card')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewType === 'card'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white dark:text-slate-300 shadow-sm border border-slate-200/30 dark:border-slate-800/30'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span>Card View</span>
                    </button>
                </div>
            </div>

            {/* Assets List Content */}
            {viewType === 'table' ? (
                <AssetTable assets={filteredAssets} onEdit={onEdit} onDelete={onDelete} onQRCode={onPrint} onHistory={onHistory} onAssign={onAssign} onView={onView} canAssign={canAssign} />
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 p-2">
                    {filteredAssets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} onEdit={onEdit} onDelete={onDelete} onQRCode={onPrint} onHistory={onHistory} onAssign={onAssign} onView={onView} canAssign={canAssign} />
                    ))}
                </div>
            )}
        </div>
    );
};

