"use client"

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { BrainCircuit, Loader2 } from "lucide-react";

export interface OverviewData {
    name: string;
    receita: number;
    despesa: number;
    isProjection?: boolean;
}

export function Overview({ data: pastData }: { data: OverviewData[] }) {
    const [projection, setProjection] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/ai/cashflow-projection")
            .then(res => res.json())
            .then(data => setProjection(data))
            .catch(() => setProjection(null))
            .finally(() => setLoading(false));
    }, []);

    // Combine past data with projection
    // pastData arrives as [month-5, ..., month-0]
    // we want to show a flow: maybe just the last few and then the projection?
    // The design shows "Hoje", "+5 dias", "+10 dias", "+15 dias"

    // For the "Fluxo de Caixa & Projeção AI", let's use a simpler visualization 
    // that matches the Stitch design: mostly bars.

    const combinedData = [
        ...pastData.slice(-3).map(d => ({
            name: d.name,
            valor: d.receita - d.despesa,
            isProjection: false,
            tooltipText: `Saldo do mês: ${(d.receita - d.despesa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        })),
        ...(projection?.projectedBars?.map((p: any) => ({
            name: p.label,
            valor: p.delta,
            isProjection: true,
            tooltipText: `Equilíbrio: ${p.delta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\nSaldo Final: ${p.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        })) || [])
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="text-lg font-bold flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-primary" />
                        Lucro Líquido & Saldo Livre AI
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Quanto sobra ao final de cada período</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">Realizado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-0.5 border-t-2 border-dashed border-cyan-400"></span>
                        <span className="text-[9px] font-bold text-cyan-400 uppercase">Projeção AI</span>
                    </div>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedData}>
                        <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#71717a", fontWeight: "bold" }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }}
                            formatter={(value: any, name: any, props: any) => [props.payload.tooltipText, ""]}
                            labelStyle={{ display: 'none' }}
                        />
                        <Bar
                            dataKey="valor"
                            radius={[4, 4, 0, 0]}
                        >
                            {combinedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isProjection ? (entry.valor >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)") : (entry.valor >= 0 ? "#1978e5" : "#ef4444")}
                                    stroke={entry.isProjection ? (entry.valor >= 0 ? "#22c55e" : "#ef4444") : "none"}
                                    strokeDasharray={entry.isProjection ? "4 4" : "0"}
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl flex items-center gap-4">
                <div className="bg-cyan-500/10 p-2 rounded-lg shrink-0">
                    <BrainCircuit className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed">
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                            <span>Calculando tendências...</span>
                        </div>
                    ) : (
                        <p>
                            <span className="font-black text-cyan-400 uppercase tracking-tighter mr-1">Análise de Saldo:</span>
                            {projection?.insight || "Identificamos estabilidade no seu padrão de consumo para as próximas semanas."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

