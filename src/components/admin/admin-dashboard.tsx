"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, TrendingDown, TrendingUp, Activity } from "lucide-react";

interface Metrics {
    totalUsers: number;
    activeUsers: number;
    mrr: number;
    churnRate: number;
    projection12Months: number;
    monthlyProjection: { month: string; value: number }[];
}

export function AdminDashboard() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/metrics")
            .then(res => res.json())
            .then(data => setMetrics(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
            </div>
        );
    }

    if (!metrics) return null;

    const formatCurrency = (value: number) =>
        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const maxProjection = Math.max(...metrics.monthlyProjection.map(m => m.value), 1);

    return (
        <div className="p-6 md:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                    Visão Geral do <span className="italic text-cyan-400">Negócio</span>
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                    Métricas consolidadas da plataforma MyLife em tempo real.
                </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total de Usuários</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{metrics.totalUsers.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-emerald-400 mt-2">
                        {metrics.activeUsers} ativos
                    </p>
                </div>

                {/* MRR */}
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">MRR (Recurso Mensal)</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{formatCurrency(metrics.mrr)}</span>
                    </div>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Receita recorrente
                    </p>
                </div>

                {/* Churn Rate */}
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Churn Rate (Cancelamentos)</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{metrics.churnRate}%</span>
                    </div>
                    <p className="text-xs text-red-400 mt-2">
                        Taxa de cancelamento
                    </p>
                </div>

                {/* 12-Month Projection */}
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Projeção 12 Meses</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{formatCurrency(metrics.projection12Months)}</span>
                    </div>
                    <p className="text-xs text-purple-400 mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Baseado no MRR atual
                    </p>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Receita vs. Projeção</h3>
                        <p className="text-xs text-zinc-500">Histórico e futuro de ganhos</p>
                    </div>
                </div>
                <div className="flex items-end gap-2 h-48">
                    {metrics.monthlyProjection.map((item, i) => {
                        const height = (item.value / maxProjection) * 100;
                        const isCurrent = i === 0;
                        return (
                            <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="relative w-full flex justify-center">
                                    <div className="absolute -top-8 bg-zinc-800 px-2 py-1 rounded text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {formatCurrency(item.value)}
                                    </div>
                                    <div
                                        className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${isCurrent
                                            ? "bg-gradient-to-t from-cyan-600 to-cyan-400"
                                            : "bg-gradient-to-t from-cyan-900/60 to-cyan-700/40 hover:from-cyan-800/80 hover:to-cyan-600/60"
                                            }`}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                </div>
                                <span className={`text-[10px] font-bold tracking-wider ${isCurrent ? "text-cyan-400" : "text-zinc-600"}`}>
                                    {item.month}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
