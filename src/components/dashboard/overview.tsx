"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

export interface OverviewData {
    name: string;
    receita: number;
    despesa: number;
}

export function Overview({ data }: { data: OverviewData[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                />
                <Bar
                    dataKey="receita"
                    fill="#34d399"
                    radius={[4, 4, 0, 0]}
                    name="Receita"
                />
                <Bar
                    dataKey="despesa"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    name="Despesa"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
