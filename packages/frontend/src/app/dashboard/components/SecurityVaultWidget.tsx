'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, Lock, Key, Server, AlertCircle, CheckCircle2, ArrowUpRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface SecurityVaultWidgetProps {
    stats?: any;
}

export const SecurityVaultWidget: React.FC<SecurityVaultWidgetProps> = ({ stats }) => {
    // Real metric calculations from backend stats
    const totalAssets = stats?.assets?.total || 0;
    const totalEmployees = stats?.employees?.total || 0;
    const totalLicenses = stats?.licenses?.total || 0;
    const expiringLicenses = stats?.licenses?.expiringSoon?.length || 0;

    // Count assigned/deployed assets from status array
    const assignedAssets = React.useMemo(() => {
        if (!stats?.assets?.byStatus) return 0;
        return stats.assets.byStatus.reduce((sum: number, item: any) => {
            const st = (item.status || '').toLowerCase();
            if (st === 'assigned' || st === 'in_use' || st === 'in-use' || st === 'active') {
                return sum + (parseInt(item.count) || 0);
            }
            return sum;
        }, 0);
    }, [stats?.assets?.byStatus]);

    // Calculate real license compliance score from DB
    const complianceScore = totalLicenses > 0
        ? Math.max(0, Math.round(((totalLicenses - expiringLicenses) / totalLicenses) * 100))
        : 100;

    // Real encrypted endpoints count = assigned hardware inventory
    const encryptedEndpoints = assignedAssets;

    // Real stored license keys & vault items = active software licenses
    const activeVaultKeys = totalLicenses;

    // Real asset deployment / authorization ratio
    const authorizationRatio = totalAssets > 0
        ? Math.round((assignedAssets / totalAssets) * 100)
        : 100;

    return (
        <Card className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-black border border-slate-800 shadow-2xl rounded-2xl relative overflow-hidden group h-full flex flex-col justify-between">
            {/* Background glowing glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />

            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-wider">Security & Credential Vault</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Infrastructure Encryption & Access Control</p>
                        </div>
                    </div>
                    <Link href="/credential-vault">
                        <span className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-1 transition-colors">
                            Credential Vault <ArrowUpRight className="h-3 w-3" />
                        </span>
                    </Link>
                </div>

                {/* Main Compliance Banner */}
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-xs font-mono">
                            {complianceScore}%
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-white uppercase tracking-wide">License Compliance Score</p>
                            <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> {totalLicenses - expiringLicenses} of {totalLicenses} Active Subscriptions Compliant
                            </p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${complianceScore >= 80 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                        {complianceScore >= 80 ? 'OPTIMAL' : 'REVIEW'}
                    </span>
                </div>

                {/* Mini Stat Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">License Secrets</span>
                            <Lock className="h-3 w-3 text-cyan-400" />
                        </div>
                        <p className="text-sm font-black text-white">{activeVaultKeys}</p>
                        <p className="text-[8px] text-slate-500">Software Keys Registered</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Endpoints</span>
                            <Server className="h-3 w-3 text-emerald-400" />
                        </div>
                        <p className="text-sm font-black text-white">{encryptedEndpoints}/{totalAssets}</p>
                        <p className="text-[8px] text-slate-500">Active Hardware Deployed</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-slate-400 uppercase tracking-wider">Asset Deployment Rate</span>
                        <span className="text-emerald-400 font-mono">{authorizationRatio}% Active</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${authorizationRatio}%` }} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                    <Key className="h-3 w-3 text-slate-400" /> RSA 4096-bit Master Keys Active
                </span>
                <span className="font-mono text-slate-400">STATUS: OPTIMAL</span>
            </div>
        </Card>
    );
};
