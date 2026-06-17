'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
    emerald: '#10B981',
    teal: '#14B8A6',
    cyan: '#06B6D4',
    sky: '#0EA5E9',
    blue: '#3B82F6',
    violet: '#8B5CF6',
    amber: '#F59E0B',
    rose: '#F43F5E',
    fuchsia: '#D946EF',
    orange: '#F97316',
};

const CHART_COLORS = [
    COLORS.emerald, COLORS.violet, COLORS.amber, COLORS.rose,
    COLORS.cyan, COLORS.fuchsia, COLORS.orange, COLORS.blue
];

interface AssetDistributionChartProps {
    data: any[]
}

export const AssetDistributionChart: React.FC<AssetDistributionChartProps> = ({ data }) => {
    // If data is empty or invalid, show empty state or return null
    if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No data</div>;

    const totalAssets = data.reduce((sum, entry) => sum + entry.value, 0);

    return (
        <ResponsiveContainer minWidth={0} width="100%" height="100%" minHeight={220}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                    ))}
                </Pie>
                {/* Center Text */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-900 dark:fill-white font-black text-xl"
                >
                    {totalAssets}
                </text>
                <text
                    x="50%"
                    y="62%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-400 font-bold text-[8px] uppercase tracking-widest"
                >
                    Total Assets
                </text>
                <Tooltip
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
                <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                        fontSize: '10px',
                        fontWeight: '700',
                        paddingTop: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
