"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface CreditCardProjectionsProps {
    cards: any[];
}

export function CreditCardProjectionsChart({ cards }: CreditCardProjectionsProps) {
    const projections = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const data = Array.from({ length: 6 }).map((_, i) => {
            const tempDate = new Date(currentYear, currentMonth + i, 1);
            const targetM = tempDate.getMonth();
            const targetY = tempDate.getFullYear();

            // Somas todas as transações de todos os cartões (parcelas futuras) que caem neste mês/ano
            let monthTotal = 0;
            cards.forEach(card => {
                if (!card.transactions) return;
                monthTotal += card.transactions
                    .filter((tx: any) => {
                        const txDate = new Date(tx.date);
                        return txDate.getMonth() === targetM && txDate.getFullYear() === targetY;
                    })
                    .reduce((acc: number, tx: any) => acc + Math.abs(Number(tx.amount)), 0);
            });

            return {
                label: tempDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
                total: monthTotal,
            };
        });

        const maxTotal = Math.max(...data.map(d => d.total), 1); // fallback 1 to avoid div by 0

        return data.map(d => ({
            ...d,
            percent: (d.total / maxTotal) * 100
        }));

    }, [cards]);

    return (
        <Card className="border-zinc-800/50 bg-zinc-950/50 shadow-2xl relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Projeção de Faturas (6 Meses)
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                        Soma global de parcelas e faturas futuras
                    </CardDescription>
                </div>
                <Link href="/credit-cards/simulator">
                    <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors uppercase font-black text-[10px] tracking-widest bg-zinc-950">
                        Análise e Simulação <ArrowRight className="w-3 h-3 ml-2" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
                <div className="h-64 flex items-end gap-4">
                    {projections.map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                            {/* Tooltip Hover */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs font-bold py-1 px-3 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20">
                                {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                {/* Tooltip Arrow */}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
                            </div>

                            {/* Bar */}
                            <div
                                className="w-full bg-gradient-to-t from-emerald-900/40 to-emerald-500/80 rounded-t-sm transition-all duration-1000 group-hover:brightness-125 border-t border-emerald-400/50"
                                style={{ height: `${Math.max(item.percent, 2)}%` }} // min height 2% for visibility
                            />

                            {/* Label */}
                            <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mt-4">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
