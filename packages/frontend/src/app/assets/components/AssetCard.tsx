'use client';

import { Laptop, Monitor, Smartphone, Tablet, HardDrive, User, CheckCircle2, UserPlus, Pencil, Trash2, History, QrCode, Eye } from 'lucide-react';

interface AssetCardProps {
    asset: any;
    onEdit: (asset: any) => void;
    onDelete: (asset: any) => void;
    onQRCode: (asset: any) => void;
    onHistory: (asset: any) => void;
    onAssign: (asset: any) => void;
    onView: (asset: any) => void;
}

const getAssetIcon = (name?: string) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('laptop') || lowerName.includes('macbook')) return Laptop;
    if (lowerName.includes('monitor') || lowerName.includes('screen') || lowerName.includes('display')) return Monitor;
    if (lowerName.includes('phone') || lowerName.includes('iphone') || lowerName.includes('android')) return Smartphone;
    if (lowerName.includes('tablet') || lowerName.includes('ipad')) return Tablet;
    return HardDrive;
};

const getStatusConfig = (status?: string) => {
    const statusUpper = (status || 'AVAILABLE').toUpperCase();
    const configs: Record<string, { color: string; bg: string; gradient: string; icon: any }> = {
        'AVAILABLE': {
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            gradient: 'from-emerald-500/10 to-teal-500/10',
            icon: CheckCircle2
        },
        'IN_USE': {
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            gradient: 'from-blue-500/10 to-cyan-500/10',
            icon: User
        },
        'INUSE': {
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            gradient: 'from-blue-500/10 to-cyan-500/10',
            icon: User
        },
        // Keep other statuses if needed for future or specific cases, but for now specific icons are removed from imports if unused
        // But let's keep the config objects just in case
    };
    return configs[statusUpper] || configs['AVAILABLE'];
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onEdit, onDelete, onQRCode, onHistory, onAssign, onView }: AssetCardProps) => {
    const assetName = asset.assetName || 'Unnamed Asset';
    const AssetIcon = getAssetIcon(asset.assetName);
    const statusConfig = getStatusConfig(asset.status);
    const StatusIcon = statusConfig.icon;

    // Explicitly check for available status
    const isAvailable = (asset.status || '').toUpperCase() === 'AVAILABLE';

    return (
        <div className="group relative h-full">
            {/* Solid Card */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col">


                {/* Status Accent Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusConfig.gradient.replace('/10', '')}`}></div>

                <div className="relative p-4 flex flex-col h-full">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Icon with Gradient Background */}
                            <div className={`relative p-2 rounded-xl bg-gradient-to-br ${statusConfig.gradient} border border-slate-200/50 dark:border-slate-700/50 shadow-sm`}>
                                <AssetIcon className={`h-5 w-5 ${statusConfig.color}`} />
                                <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                                    <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                                </div>
                            </div>

                            {/* Asset Info */}
                            <div className="min-w-0 pr-2">
                                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight break-words overflow-hidden" title={assetName}>
                                    {assetName}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.color} border-current/10 whitespace-nowrap`}>
                                        {['IN_USE', 'INUSE'].includes((asset.status || '').toUpperCase()) ? 'In Use' : (asset.status || 'Available').replace(/_/g, ' ')}
                                    </span>
                                    {asset.model && (
                                        <span className="text-[11px] text-slate-500 font-medium truncate">{asset.model}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-0.5 shrink-0">
                            <button
                                onClick={() => onView(asset)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="View Details"
                            >
                                <Eye className="h-4 w-4" />
                            </button>

                            <button
                                onClick={() => onEdit(asset)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>

                            <button
                                onClick={() => onDelete(asset)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-3 mb-4">
                        {/* Serial Number - Prominent */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800 flex items-center justify-between group/serial">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Serial / Tag</span>
                            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 select-all">{asset.serialNumber || 'N/A'}</span>
                        </div>

                        {/* Assignment Info - Only show for IN_USE assets */}
                        {['IN_USE', 'INUSE'].includes((asset.status || '').toUpperCase()) ? (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-2.5 border border-blue-100 dark:border-blue-900/20">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                        <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-0.5">Assigned To</p>
                                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300 truncate" title={asset.assignedTo}>{asset.assignedTo || 'Unknown User'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Placeholder or Available Message to keep card height consistent
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg p-2.5 border border-emerald-100 dark:border-emerald-900/20 flex items-center gap-2.5 opacity-70">
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Ready for Assignment</span>
                            </div>
                        )}

                        {/* Financial Info (Feature 4) */}
                        {(asset.purchaseCost > 0) && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Purchase</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">${Number(asset.purchaseCost).toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Valuation</p>
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">${Number(asset.currentValue).toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                        <button
                            onClick={() => onAssign(asset)}
                            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isAvailable
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            title={isAvailable ? "Assign Asset" : "Reassign Asset"}
                        >
                            <UserPlus className="h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{isAvailable ? 'Assign' : 'Reassign'}</span>
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onHistory(asset)}
                                className="flex items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all border border-slate-200/50 dark:border-slate-700"
                                title="History"
                            >
                                <History className="h-4 w-4" />
                            </button>

                            <button
                                onClick={() => onQRCode(asset)}
                                className="flex items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all border border-slate-200/50 dark:border-slate-700"
                                title="QR Code"
                            >
                                <QrCode className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
