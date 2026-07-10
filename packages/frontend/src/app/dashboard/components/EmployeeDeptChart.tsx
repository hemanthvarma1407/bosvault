'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const COLORS = {
    violet: '#8B5CF6',
    purple: '#A855F7',
};

interface EmployeeDeptChartProps {
    data: any[]
}

export const EmployeeDeptChart: React.FC<EmployeeDeptChartProps> = ({ data }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[300px] w-full bg-slate-50/50 dark:bg-slate-900/10 rounded-xl animate-pulse" />;
    if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No data</div>;

    return (
        <ResponsiveContainer minWidth={0} width="100%" height="100%" minHeight={300}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 10, right: 40, left: 60, bottom: 5 }}
                barSize={32}
            >
                <defs>
                    <linearGradient id="employeeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={COLORS.violet} stopOpacity={1} />
                        <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.8} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} vertical={false} />
                <XAxis type="number" hide />
                <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontWeight: 600 }}
                    width={55}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                    contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '11px',
                        color: '#fff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }}
                />
                <Bar
                    dataKey="value"
                    fill="url(#employeeGradient)"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                    label={{
                        position: 'right',
                        fill: '#64748b',
                        fontSize: 10,
                        fontWeight: 700,
                        offset: 10
                    }}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
