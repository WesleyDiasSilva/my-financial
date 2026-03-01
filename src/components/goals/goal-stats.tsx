"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, TrendingUp, Wallet, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalStatsProps {
    totalSaved: number;
    averageSaving: number;
}

export function GoalStats({ totalSaved, averageSaving }: GoalStatsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Total Guardado */}
            <Card className="shadow-2xl border-zinc-800/50 bg-zinc-950/50 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PiggyBank className="h-20 w-20 text-emerald-500 -rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Patrimônio em Metas & Inv.</CardTitle>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Wallet className="h-4 w-4 text-emerald-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-white whitespace-nowrap">
                        {totalSaved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <p className="text-[10px] uppercase font-bold text-emerald-500/60 mt-2 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Valor total alocado hoje
                    </p>
                </CardContent>
            </Card>

            {/* Média de Economia */}
            <Card className="shadow-2xl border-zinc-800/50 bg-zinc-950/50 hover:border-blue-500/30 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp className="h-20 w-20 text-blue-500 -rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Média de Economia Mensal</CardTitle>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-white whitespace-nowrap">
                        {averageSaving.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <p className="text-[10px] uppercase font-bold text-blue-500/60 mt-2 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Baseado nos últimos meses
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
