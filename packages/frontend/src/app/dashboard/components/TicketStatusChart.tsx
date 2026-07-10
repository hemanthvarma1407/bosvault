'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const COLORS = {
    blue: '#3B82F6',
    cyan: '#06B6D4',
};

interface TicketStatusChartProps {
     data: any[] 
}

export const TicketStatusChart: React.FC<TicketStatusChartProps> = ({ data  }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[100px] w-full bg-slate-50/50 dark:bg-slate-900/10 rounded-xl animate-pulse" />;
    if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No data</div>;

    return (
        <ResponsiveContainer minWidth={0} width="100%" height="100%" minHeight={100}>
            <BarChart data={data} layout="vertical">
                <defs>
                    <linearGradient id="horizontalGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={COLORS.blue} stopOpacity={1} />
                        <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0.7} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    fontWeight={500}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    fontWeight={500}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                />
                <Bar
                    dataKey="value"
                    fill="url(#horizontalGradient)"
                    radius={[0, 6, 6, 0]}
                    barSize={22}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
