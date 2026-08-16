'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface SoftwareComplianceChartProps {
    totalLicenses?: number;
    expiringCount?: number;
}

export const SoftwareComplianceChart: React.FC<SoftwareComplianceChartProps> = ({
    totalLicenses = 0,
    expiringCount = 0
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeSeats = Math.max(0, totalLicenses - expiringCount);
    const expiringSeats = expiringCount;

    const data = [
        { name: 'Active & Compliant', value: activeSeats || 1, color: '#10B981' },
        { name: 'Renewal Required', value: expiringSeats || 0, color: '#F59E0B' }
    ];

    if (!mounted) {
        return <div className="h-48 w-full bg-slate-800/30 rounded-xl animate-pulse" />;
    }

    return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                            color: '#f8fafc',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 -mt-2">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}:</span>
                        <span className="font-mono text-white">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
