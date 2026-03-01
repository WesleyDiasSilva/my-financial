"use client";

import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface FinancialProjectionProps {
    transactions: any[];
    accounts: any[];
}

export function FinancialProjection({ transactions, accounts }: FinancialProjectionProps) {
    const today = new Date();
    const currentBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

    const projection = [];

    // Generate next 3 months
    for (let i = 1; i <= 3; i++) {
        const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthLabel = projectionDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        let projectedIncome = 0;
        let projectedExpense = 0;

        transactions.forEach((tx) => {
            if (!tx.isRecurring) return;

            const txDate = new Date(tx.date);
            const recurrenceType = tx.recurrenceType;
            const period = tx.recurrencePeriod || 1;

            if (recurrenceType === 'MONTHLY') {
                const monthDiff = (projectionDate.getFullYear() - txDate.getFullYear()) * 12 + (projectionDate.getMonth() - txDate.getMonth());
                if (monthDiff >= 0 && monthDiff % period === 0) {
                    if (tx.type === 'INCOME') projectedIncome += Math.abs(Number(tx.amount));
                    else projectedExpense += Math.abs(Number(tx.amount));
                }
            } else if (recurrenceType === 'WEEKLY') {
                const totalOccurrences = Math.floor(4 / period);
                if (tx.type === 'INCOME') projectedIncome += Math.abs(Number(tx.amount)) * totalOccurrences;
                else projectedExpense += Math.abs(Number(tx.amount)) * totalOccurrences;
            } else if (recurrenceType === 'YEARLY') {
                if (projectionDate.getMonth() === txDate.getMonth()) {
                    if (tx.type === 'INCOME') projectedIncome += Math.abs(Number(tx.amount));
                    else projectedExpense += Math.abs(Number(tx.amount));
                }
            }
        });

        projection.push({
            month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            income: projectedIncome,
            expense: projectedExpense,
            balance: projectedIncome - projectedExpense
        });
    }

    let runningBalance = currentBalance;

    return (
        <div className="pb-10">
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Projeção de Saúde Financeira
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projection.map((p, idx) => {
                    runningBalance += p.balance;
                    const isSafe = runningBalance >= 0;

                    return (
                        <div key={idx} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">{p.month}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${isSafe ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-400'}`}>
                                    {isSafe ? 'Saudável' : 'Atenção'}
                                </span>
                            </div>
                            <p className="text-[9px] text-zinc-500 uppercase mb-1">Resultado Estimado</p>
                            <p className="text-2xl font-black text-white">
                                {runningBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${isSafe ? 'bg-emerald-500' : 'bg-orange-400'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, (runningBalance / (currentBalance || 1)) * 100))}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

