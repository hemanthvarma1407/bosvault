'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const COLORS = {
    amber: '#F59E0B',
    orange: '#F97316',
};

interface TicketPriorityChartProps {
    data: any[]
}

export default function TicketPriorityChart({ data }: TicketPriorityChartProps) {
    // Ensure we always have 4 levels for visual consistency
    const levels = ['low', 'medium', 'high', 'critical'];
    const chartData = levels.map(level => {
        const item = data?.find(d => d.name.toLowerCase() === level);
        return {
            name: level.toUpperCase(),
            value: item ? Number(item.value) : 0
        };
    });

    if (!chartData || chartData.length === 0) return <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No data</div>;

    return (
        <ResponsiveContainer minWidth={0} width="100%" height="100%" minHeight={300}>
            <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                barSize={48}
            >
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.amber} stopOpacity={1} />
                        <stop offset="100%" stopColor={COLORS.orange} stopOpacity={0.8} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.1} />
                <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontWeight: 600 }}
                    dy={5}
                />
                <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontWeight: 600 }}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(251, 191, 36, 0.05)' }}
                    contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '11px',
                        color: '#fff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }}
                    itemStyle={{ color: '#fff' }}
                />
                <Bar
                    dataKey="value"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
