"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface UtilizationProps {
    purchased: number;
    assigned: number;
}

export default function LicenseUtilizationChart({ purchased, assigned }: UtilizationProps) {
    const unused = Math.max(0, purchased - assigned);
    const utilizationRate = purchased > 0 ? Math.round((assigned / purchased) * 100) : 0;

    const data = [
        { name: 'Assigned', value: assigned, color: '#6366f1' }, // Indigo 500
        { name: 'Available', value: unused, color: '#10b981' }  // Emerald 500
    ];

    if (assigned > purchased) {
        data[0].color = '#ef4444'; // Rose 500 if over limit
    }

    return (
        <div className="relative h-64 w-full group">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{utilizationRate}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Utilization</span>
            </div>

            <ResponsiveContainer minWidth={0} width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                style={{ filter: `drop-shadow(0 0 8px ${entry.color}44)` }}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '12px'
                        }}
                        itemStyle={{
                            fontSize: '11px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    />
                    <Legend
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
