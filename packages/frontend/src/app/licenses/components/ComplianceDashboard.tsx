"use client";

import React, { useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Sparkles, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface ComplianceItem {
    appName: string;
    purchased: number;
    assigned: number;
    status: 'COMPLIANT' | 'OVER_LICENSED' | 'UNDER_UTILIZED';
}

interface ComplianceDashboardProps {
    data: ComplianceItem[];
}

export default function ComplianceDashboard({ data }: ComplianceDashboardProps) {
    const aiInsights = useMemo(() => {
        const insights = [];
        const overLicensed = data.filter(i => i.status === 'OVER_LICENSED');
        const underUtilized = data.filter(i => i.status === 'UNDER_UTILIZED');

        if (overLicensed.length > 0) {
            insights.push({
                type: 'warning',
                title: 'License Breach Detected',
                message: `You are exceeding limits for ${overLicensed.length} application(s). Procure ${overLicensed.reduce((acc, i) => acc + (i.assigned - i.purchased), 0)} more seats to avoid compliance risks.`,
                icon: <AlertTriangle className="w-4 h-4 text-rose-500" />
            });
        }

        if (underUtilized.length > 0) {
            insights.push({
                type: 'optimization',
                title: 'Cost Saving Opportunity',
                message: `Identified ${underUtilized.reduce((acc, i) => acc + (i.purchased - i.assigned), 0)} unused seats across ${underUtilized.length} apps. Reducing these could save significant budget.`,
                icon: <TrendingDown className="w-4 h-4 text-emerald-500" />
            });
        }

        if (data.length > 0 && overLicensed.length === 0) {
            insights.push({
                type: 'success',
                title: 'Healthy Portfolio',
                message: 'All monitored software applications are within their respective license boundaries.',
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            });
        }

        return insights;
    }, [data]);

    return (
        <div className="space-y-8">
            {/* AI Insights Section */}
            <div className="p-6 bg-gradient-to-br from-slate-900/10 via-violet-500/10 to-transparent rounded-[2.5rem] border border-slate-700/20 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-32 h-32 text-slate-900 dark:text-white rotate-12" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-900 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Compliance Advisor</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time intelligent recommendations</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiInsights.length > 0 ? aiInsights.map((insight, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 backdrop-blur-sm">
                                <div className="mt-1">{insight.icon}</div>
                                <div>
                                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{insight.title}</h4>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight">{insight.message}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center py-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Analyzing your inventory for insights...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Individual Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((item, idx) => (
                    <Card key={idx} className="overflow-hidden border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">{item.appName}</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Compliance Status</p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${item.status === 'COMPLIANT'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : item.status === 'OVER_LICENSED'
                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                    }`}>
                                    {item.status === 'COMPLIANT' && <CheckCircle2 className="w-3 h-3" />}
                                    {item.status === 'OVER_LICENSED' && <AlertTriangle className="w-3 h-3" />}
                                    {item.status === 'UNDER_UTILIZED' && <Shield className="w-3 h-3" />}
                                    {item.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchased</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{item.purchased}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-white/5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{item.assigned}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${item.assigned > item.purchased ? 'bg-rose-500' : 'bg-slate-900'}`}
                                        style={{ width: `${Math.min(100, (item.assigned / item.purchased) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                    {item.assigned > item.purchased
                                        ? `${item.assigned - item.purchased} seats over limit`
                                        : `${item.purchased - item.assigned} seats available`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
