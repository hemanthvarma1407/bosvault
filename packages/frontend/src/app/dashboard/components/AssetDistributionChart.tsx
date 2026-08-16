'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = [
    { bg: 'bg-emerald-500', text: 'text-emerald-500', bar: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    { bg: 'bg-slate-900', text: 'text-slate-900 dark:text-white', bar: 'bg-slate-900', shadow: 'shadow-black/20' },
    { bg: 'bg-amber-500', text: 'text-amber-500', bar: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
    { bg: 'bg-rose-500', text: 'text-rose-500', bar: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
    { bg: 'bg-violet-500', text: 'text-violet-500', bar: 'bg-violet-500', shadow: 'shadow-violet-500/20' },
    { bg: 'bg-cyan-500', text: 'text-cyan-500', bar: 'bg-cyan-500', shadow: 'shadow-cyan-500/20' },
];

interface AssetDistributionChartProps {
    data: any[]
}

export const AssetDistributionChart: React.FC<AssetDistributionChartProps> = ({ data }) => {
    if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No data</div>;

    const totalAssets = data.reduce((sum, entry) => sum + entry.value, 0);
    const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);

    return (
        <div className="w-full h-full flex flex-col pt-2">
            <div className="flex items-center justify-between mb-4 px-2">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Assets</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-none">
                        {totalAssets}
                    </p>
                </div>
                <div className="flex -space-x-2">
                    {sortedData.slice(0, 3).map((item, idx) => (
                        <div key={idx} className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 ${COLORS[idx % COLORS.length].bg} flex items-center justify-center text-[10px] font-black text-white shadow-lg z-${30 - idx * 10}`} title={item.name}>
                            {Math.round((item.value / totalAssets) * 100)}%
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {sortedData.map((item, index) => {
                    const percentage = totalAssets > 0 ? (item.value / totalAssets) * 100 : 0;
                    const colorSet = COLORS[index % COLORS.length];

                    return (
                        <div key={item.name} className="group relative">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${colorSet.bg} shadow-sm ${colorSet.shadow}`} />
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">{item.value}</span>
                                    <span className="text-[9px] font-bold text-slate-400 tabular-nums w-8 text-right">{percentage.toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                    className={`h-full rounded-full ${colorSet.bg} shadow-sm`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
