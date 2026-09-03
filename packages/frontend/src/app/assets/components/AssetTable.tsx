'use client';

import React from 'react';
import { Laptop, Monitor, Smartphone, Tablet, HardDrive, User, CheckCircle2, UserPlus, Pencil, Trash2, History, QrCode, Eye, CreditCard } from 'lucide-react';

import { Asset } from '../types';

interface AssetTableProps {
    assets: Asset[];
    onEdit: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
    onQRCode: (asset: Asset) => void;
    onHistory: (asset: Asset) => void;
    onAssign: (asset: Asset) => void;
    onView: (asset: Asset) => void;
    canAssign?: boolean;
}

const getAssetIcon = (name?: string) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('laptop') || lowerName.includes('macbook')) return Laptop;
    if (lowerName.includes('monitor') || lowerName.includes('screen') || lowerName.includes('display')) return Monitor;
    if (lowerName.includes('phone') || lowerName.includes('iphone') || lowerName.includes('android')) return Smartphone;
    if (lowerName.includes('tablet') || lowerName.includes('ipad')) return Tablet;
    if (lowerName.includes('terminal') || lowerName.includes('stripe') || lowerName.includes('card reader') || lowerName.includes('reader') || lowerName.includes('pos')) return CreditCard;
    return HardDrive;
};

const getStatusConfig = (status?: string) => {
    const statusUpper = (status || 'AVAILABLE').toUpperCase();
    const configs: Record<string, { text: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
        'AVAILABLE': {
            text: 'Available',
            color: 'text-emerald-700 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            border: 'border-emerald-200 dark:border-emerald-900/30',
            icon: CheckCircle2
        },
        'IN_USE': {
            text: 'In Use',
            color: 'text-blue-700 dark:text-slate-300',
            bg: 'bg-slate-100 dark:bg-slate-800/60 dark:bg-blue-950/30',
            border: 'border-blue-200 dark:border-blue-900/30',
            icon: User
        },
        'INUSE': {
            text: 'In Use',
            color: 'text-blue-700 dark:text-slate-300',
            bg: 'bg-slate-100 dark:bg-slate-800/60 dark:bg-blue-950/30',
            border: 'border-blue-200 dark:border-blue-900/30',
            icon: User
        },
        'MAINTENANCE': {
            text: 'Maintenance',
            color: 'text-amber-700 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            border: 'border-amber-200 dark:border-amber-900/30',
            icon: History
        },
        'RETIRED': {
            text: 'Retired',
            color: 'text-slate-700 dark:text-slate-400',
            bg: 'bg-slate-50 dark:bg-slate-900/30',
            border: 'border-slate-200 dark:border-slate-800',
            icon: History
        }
    };
    return configs[statusUpper] || configs['AVAILABLE'];
};

export const AssetTable: React.FC<AssetTableProps> = ({
    assets,
    onEdit,
    onDelete,
    onQRCode,
    onHistory,
    onAssign,
    onView,
    canAssign = false
}) => {
    return (
        <div className="w-full overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 dark:border-slate-800">
                    <thead>
                        <tr className="bg-slate-50/75 dark:bg-slate-950/50">
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 text-left">Asset Info</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 text-center">Serial Number</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 text-center">Status</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 text-center">Assignment</th>
                            <th className="p-4 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {assets.map((asset) => {
                            const assetName = asset.assetName || 'Unnamed Asset';
                            const AssetIcon = getAssetIcon(asset.assetName);
                            const statusConfig = getStatusConfig(asset.status);
                            const isAvailable = (asset.status || '').toUpperCase() === 'AVAILABLE';

                            return (
                                <tr 
                                    key={asset.id} 
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200 group"
                                >
                                    {/* Asset Info - Left Aligned */}
                                    <td className="p-4 border border-slate-200 dark:border-slate-800 text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-105 transition-transform duration-200">
                                                <AssetIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                                    {assetName}
                                                </div>
                                                {asset.model && (
                                                    <div className="text-xs text-slate-500 font-medium">
                                                        {asset.model}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Serial Number - Center Aligned */}
                                    <td className="p-4 border border-slate-200 dark:border-slate-800 text-center">
                                        <span className="inline-block font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded select-all border border-slate-200/50 dark:border-slate-800">
                                            {asset.serialNumber || 'N/A'}
                                        </span>
                                    </td>

                                    {/* Status Badge - Center Aligned */}
                                    <td className="p-4 border border-slate-200 dark:border-slate-800 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            {statusConfig.text}
                                        </span>
                                    </td>

                                    {/* Assignment - Center Aligned */}
                                    <td className="p-4 border border-slate-200 dark:border-slate-800 text-center">
                                        {['IN_USE', 'INUSE'].includes((asset.status || '').toUpperCase()) ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-slate-900 dark:text-white dark:text-slate-300">
                                                    <User className="h-3 w-3" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={asset.assignedTo}>
                                                        {asset.assignedTo || 'Unknown User'}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                </div>
                                                <span className="text-xs font-bold">Ready</span>
                                            </div>
                                        )}
                                    </td>



                                    {/* Actions - Center Aligned */}
                                    <td className="p-4 border border-slate-200 dark:border-slate-800 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {/* Assign Action */}
                                            {canAssign && (
                                                <button
                                                    onClick={() => onAssign(asset)}
                                                    className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                                        isAvailable
                                                            ? 'bg-slate-100 dark:bg-slate-800/60 dark:bg-indigo-950/40 text-slate-900 dark:text-white dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                                                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                                    title={isAvailable ? "Assign" : "Reassign"}
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    <span className="hidden md:inline">{isAvailable ? 'Assign' : 'Reassign'}</span>
                                                </button>
                                            )}

                                            {/* History */}
                                            <button
                                                onClick={() => onHistory(asset)}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                                title="History"
                                            >
                                                <History className="h-3.5 w-3.5" />
                                            </button>

                                            {/* QR Code */}
                                            <button
                                                onClick={() => onQRCode(asset)}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                                title="QR Code"
                                            >
                                                <QrCode className="h-3.5 w-3.5" />
                                            </button>

                                            {/* Separator */}
                                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                                            {/* View */}
                                            <button
                                                onClick={() => onView(asset)}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>

                                            {/* Edit */}
                                            <button
                                                onClick={() => onEdit(asset)}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => onDelete(asset)}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
