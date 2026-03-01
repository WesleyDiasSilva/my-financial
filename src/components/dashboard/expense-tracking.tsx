"use client";

import { PieChart as PieChartIcon } from "lucide-react";

interface ExpenseTrackingProps {
    transactions: any[];
    categories: any[];
    currentMonth: number;
    currentYear: number;
}

export function ExpenseTracking({ transactions, categories, currentMonth, currentYear }: ExpenseTrackingProps) {
    // Calculate total budget available from all categories' monthly limits
    const totalBudget = categories.reduce((sum: number, cat: any) => sum + (cat.monthlyLimit || 0), 0);

    const monthlyExpenses = transactions.filter((t: any) => {
        const d = new Date(t.date);
        return t.type === 'EXPENSE' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthlyExpenses.reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);

    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const cappedPercentage = Math.min(percentageUsed, 100);

    // SVG Donut properties
    const strokeWidth = 12;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (cappedPercentage / 100) * circumference;

    return (
        <div className="glass p-8 rounded-2xl border border-white/5">
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Controle de Gastos
            </h4>

            <div className="flex flex-col items-center justify-center py-4 w-full mx-auto">
                <div className="relative w-36 h-36 mb-6 flex items-center justify-center mx-auto overflow-visible">
                    <svg
                        viewBox="0 0 160 160"
                        className="w-full h-full -rotate-90 overflow-visible"
                    >
                        <circle
                            cx="80" cy="80" r="50"
                            fill="transparent"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="16"
                        />
                        <circle
                            cx="80" cy="80" r="50"
                            fill="transparent"
                            stroke="#1978e5"
                            strokeWidth="16"
                            strokeDasharray={2 * Math.PI * 50}
                            strokeDashoffset={(2 * Math.PI * 50) * (1 - Math.min(percentageUsed, 100) / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-3xl font-black text-white leading-none tracking-tighter">{percentageUsed.toFixed(0)}%</span>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Uso</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="text-center group">
                        <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover:text-cyan-400">Gasto Atual</p>
                        <p className="text-xs font-black text-white">{totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="text-center group border-l border-white/5">
                        <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover:text-orange-400">Disponível</p>
                        <p className={`text-xs font-black ${totalBudget - totalSpent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {Math.max(0, totalBudget - totalSpent).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

