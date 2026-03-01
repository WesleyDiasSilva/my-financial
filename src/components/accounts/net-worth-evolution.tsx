"use client";

import { useState, useMemo } from "react";

type MonthlyData = {
    monthStr: string;
    netWorth: number;
    dateKey: string; // YYYY-MM
};

interface NetWorthEvolutionProps {
    history: MonthlyData[];
}

export function NetWorthEvolution({ history }: NetWorthEvolutionProps) {
    const [filter, setFilter] = useState<'6M' | '1A' | 'ALL'>('1A');

    const visibleData = useMemo(() => {
        let count = history.length;
        if (filter === '6M') count = 6;
        if (filter === '1A') count = 12;

        // Return only the last `count` items
        return history.slice(-count);
    }, [history, filter]);

    const maxValue = Math.max(...visibleData.map(d => d.netWorth), 1); // Avoid division by 0

    return (
        <div className="col-span-12 lg:col-span-7 bg-zinc-950 border border-zinc-800/50 p-6 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="flex justify-between items-start mb-6 w-full">
                <div>
                    <h3 className="font-semibold text-lg text-white">Evolução de Patrimônio Líquido</h3>
                    <p className="text-xs text-zinc-500">Consolidado mensal de todas as contas e investimentos</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === '6M' ? 'bg-emerald-600 text-white font-medium' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                        onClick={() => setFilter('6M')}
                    >
                        6M
                    </button>
                    <button
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === '1A' ? 'bg-emerald-600 text-white font-medium' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                        onClick={() => setFilter('1A')}
                    >
                        1A
                    </button>
                    <button
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === 'ALL' ? 'bg-emerald-600 text-white font-medium' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                        onClick={() => setFilter('ALL')}
                    >
                        Tudo
                    </button>
                </div>
            </div>
            <div>
                <div className="h-44 relative flex items-end gap-1.5 mb-2 w-full">
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-zinc-800"></div>
                    {visibleData.map((data, i) => {
                        const heightPercent = Math.max(0, (data.netWorth / maxValue) * 100);
                        const isLast = i === visibleData.length - 1;
                        return (
                            <div
                                key={data.dateKey}
                                className={`flex-1 rounded-t-sm group relative ${isLast ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-emerald-500/20'}`}
                                style={{ height: `${heightPercent === 0 ? 5 : heightPercent}%` }}
                                title={`${data.monthStr}: ${data.netWorth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                            >
                                {!isLast && <div className="absolute inset-x-0 bottom-0 bg-emerald-500 opacity-0 group-hover:opacity-40 transition-opacity h-full"></div>}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold tracking-wider pt-2 opacity-80 w-full">
                    {visibleData.map((data, i) => (
                        <span key={data.dateKey} className={i === visibleData.length - 1 ? "text-emerald-500" : ""}>
                            {data.monthStr}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
