'use client';

import React from 'react';
import { ShoppingCart, DollarSign, Package, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DashboardStats } from '@bosvault/shared-models';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

interface ProcurementWidgetProps {
    stats: DashboardStats | null;
}

export const ProcurementWidget: React.FC<ProcurementWidgetProps> = ({ stats }) => {
    const procurement = stats?.procurement || {
        totalPOs: 0,
        totalSpend: 0,
        activeVendors: 0,
        recent: []
    };

    return (
        <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-none shadow-lg h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="p-2 px-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 shadow-inner border border-indigo-500/10">
                        <ShoppingCart className="h-4 w-4" />
                    </div>
                    Procurement Pulse
                </h3>
                <Link href="/procurement">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Spend</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">${formatNumber(procurement.totalSpend)}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <Package className="h-3 w-3 text-indigo-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{procurement.totalPOs}</p>
                </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Recent Procurement</p>
                {procurement.recent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 opacity-50">
                        <Package className="h-8 w-8 text-slate-300 mb-1" />
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">No recent orders</p>
                    </div>
                ) : (
                    procurement.recent.slice(0, 3).map((po: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">
                                    PO
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{po.poNumber}</p>
                                    <p className="text-[9px] text-slate-500 font-medium">{po.vendorName}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-slate-900 dark:text-white tracking-tighter">
                                    ${Number(po.totalAmount).toFixed(0)}
                                </p>
                                <div className="flex items-center gap-1 justify-end">
                                    <div className={`w-1 h-1 rounded-full ${po.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{po.status}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span>Real-time procurement tracking active</span>
                </div>
            </div>
        </Card>
    );
};
