"use client";

import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DepreciationChartProps {
    purchaseCost: number;
    salvageValue: number;
    usefulLifeYears: number;
    purchaseDate: Date | string;
    method: string;
}

export default function AssetDepreciationChart({ purchaseCost, salvageValue, usefulLifeYears, purchaseDate, method }: DepreciationChartProps) {
    const data = [];
    const startYear = new Date(purchaseDate).getFullYear();

    if (method === 'STRAIGHT_LINE') {
        const annualDepreciation = (purchaseCost - salvageValue) / usefulLifeYears;
        for (let i = 0; i <= usefulLifeYears; i++) {
            data.push({
                year: startYear + i,
                value: Math.max(salvageValue, purchaseCost - (annualDepreciation * i))
            });
        }
    } else {
        // Declining balance at 20%
        let currentValue = purchaseCost;
        const rate = 0.2;
        for (let i = 0; i <= usefulLifeYears; i++) {
            data.push({
                year: startYear + i,
                value: Math.max(salvageValue, currentValue)
            });
            currentValue = currentValue * (1 - rate);
        }
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer minWidth={0} width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number | string) => [`$${Number(value).toFixed(2)}`, 'Asset Value']}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
