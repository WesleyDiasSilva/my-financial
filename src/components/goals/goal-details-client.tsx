"use client";

import { useState } from "react";
import {
    Target,
    Calendar,
    ArrowLeft,
    TrendingUp,
    DollarSign,
    CheckCircle2,
    Circle,
    ArrowUpRight,
    Clock,
    History,
    Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { toggleMilestone } from "@/actions/goal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GoalDetailsClientProps {
    goal: any;
}

export function GoalDetailsClient({ goal }: GoalDetailsClientProps) {
    const [milestones, setMilestones] = useState(goal.milestones || []);

    const progress = Math.min(100, Math.floor((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100));
    const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);

    // Calcular investimento mensal necessário
    const calculateMonthly = () => {
        if (!goal.deadline || remaining <= 0) return 0;
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const diffMonths = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
        return Math.ceil(remaining / Math.max(1, diffMonths));
    };

    const monthlyNeeded = calculateMonthly();

    const handleToggleMilestone = async (id: string, currentStatus: boolean) => {
        try {
            await toggleMilestone(id, !currentStatus);
            setMilestones(milestones.map((m: any) =>
                m.id === id ? { ...m, isCompleted: !currentStatus } : m
            ));
            toast.success("Marco atualizado!");
        } catch (error) {
            toast.error("Erro ao atualizar marco.");
        }
    };

    const lastContributions = goal.transactions?.slice(0, 3) || [];

    // Preparar dados para o gráfico (acumulado nos últimos 6 meses)
    const chartData = goal.history?.map((h: any) => ({
        date: new Date(h.date).toLocaleDateString('pt-BR', { month: 'short' }),
        amount: Number(h._sum.amount)
    })) || [];

    return (
        <div className="space-y-10 pb-20">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <Link href="/goals">
                    <Button variant="ghost" className="text-zinc-500 hover:text-white gap-2 font-black uppercase text-xs tracking-widest bg-zinc-900/50 rounded-2xl h-12 px-6">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                </div>
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-zinc-950/50 p-10 rounded-[3rem] border border-zinc-900 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <Target className="w-64 h-64 text-white -rotate-12" />
                </div>

                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[2rem] bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-inner" style={{ color: goal.color }}>
                            <Target className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tighter italic">{goal.name}</h1>
                            <p className="text-zinc-500 text-lg font-bold mt-1">Sua jornada para a conquista iniciada em {new Date(goal.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Progresso Geral</span>
                            <span className="text-4xl font-black text-white italic">{progress}%</span>
                        </div>
                        <div className="h-6 bg-zinc-900 rounded-full overflow-hidden p-1.5 border border-zinc-800 shadow-inner">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_25px_rgba(0,0,0,0.5)]"
                                style={{ width: `${progress}%`, backgroundColor: goal.color }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 shrink-0">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl text-center space-y-1">
                        <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Objetivo</span>
                        <p className="text-xl font-black text-white line-clamp-1">{Number(goal.targetAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest">Prazo</span>
                        <p className="text-xl font-black text-white">{goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : "Indefinido"}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-zinc-950 border-zinc-900 rounded-[2rem] shadow-xl hover:border-zinc-700 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Prazo Final
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-white">{goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : "Livre"}</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-900 rounded-[2rem] shadow-xl hover:border-zinc-700 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" /> Acumulado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-emerald-400">{Number(goal.currentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-900 rounded-[2rem] shadow-xl hover:border-zinc-700 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5" /> Faltam
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-zinc-400">{remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-900 rounded-[2rem] shadow-xl border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Investimento Mensal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-white">{monthlyNeeded.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Evolution Chart */}
                <Card className="lg:col-span-2 bg-zinc-950 border-zinc-900 rounded-[3rem] shadow-2xl p-10 overflow-hidden relative">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <TrendingUp className="h-6 w-6 text-emerald-500" /> Evolução da Reserva
                            </h3>
                            <p className="text-zinc-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Histórico de contribuições nos últimos 6 meses</p>
                        </div>
                    </div>

                    <div className="h-[350px] w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={goal.color || "#10b981"} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={goal.color || "#10b981"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    fontSize={10}
                                    fontWeight="bold"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(str) => str.toUpperCase()}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={10}
                                    fontWeight="bold"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `R$ ${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '1rem' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#52525b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                                    formatter={(value: any) => [Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Aporte"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke={goal.color || "#10b981"}
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorAmount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Right Side: Milestones & Last Contributions */}
                <div className="space-y-10">
                    {/* Milestones */}
                    <Card className="bg-zinc-950 border-zinc-900 rounded-[3rem] shadow-2xl p-8 border-t-2 overflow-hidden" style={{ borderTopColor: goal.color }}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                <Flag className="h-5 w-5 text-zinc-400" /> Milestones
                            </h3>
                            <span className="bg-zinc-900 px-3 py-1 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-800">
                                {milestones.filter((m: any) => m.isCompleted).length}/{milestones.length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {milestones.length === 0 ? (
                                <p className="text-zinc-600 text-sm font-medium italic text-center py-6">Nenhum marco configurado para esta meta.</p>
                            ) : (
                                milestones.map((m: any) => (
                                    <div
                                        key={m.id}
                                        onClick={() => handleToggleMilestone(m.id, m.isCompleted)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                            m.isCompleted
                                                ? "bg-emerald-500/5 border-emerald-500/20 opacity-60"
                                                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        <div className={cn(
                                            "shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                            m.isCompleted ? "bg-emerald-500 text-black" : "border-2 border-zinc-700 text-zinc-700 group-hover:border-zinc-500"
                                        )}>
                                            {m.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm font-black truncate transition-all",
                                                m.isCompleted ? "text-zinc-500 line-through" : "text-white"
                                            )}>{m.description}</p>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{Number(m.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Last Contributions */}
                    <Card className="bg-zinc-950 border-zinc-900 rounded-[3rem] shadow-2xl p-8 overflow-hidden">
                        <h3 className="text-xl font-black text-white tracking-tight mb-8 flex items-center gap-3 font-italic">
                            <History className="h-5 w-5 text-zinc-400" /> Últimos Aportes
                        </h3>

                        <div className="space-y-6">
                            {lastContributions.length === 0 ? (
                                <p className="text-zinc-600 text-sm font-medium italic text-center py-6">Nenhum aporte registrado ainda.</p>
                            ) : (
                                lastContributions.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white tracking-tight uppercase line-clamp-1">{tx.description || "Aporte"}</p>
                                                <p className="text-[10px] font-bold text-zinc-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-emerald-400">+{Number(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {lastContributions.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-zinc-900 text-center">
                                <Button variant="link" className="text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors p-0">
                                    Ver todas as transações
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
