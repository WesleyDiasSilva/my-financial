"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getTransactions } from "@/actions/transaction";
import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { CreditCard, DollarSign, Wallet, TrendingUp, Sparkles, Zap, Activity } from "lucide-react";
import { Overview } from "@/components/dashboard/overview";
import { FinancialProjection } from "@/components/dashboard/financial-projection";
import { MonthFilter } from "@/components/dashboard/month-filter";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { cn } from "@/lib/utils";

import { LifeAtAGlance } from "@/components/dashboard/life-at-a-glance";
import { ExpenseTracking } from "@/components/dashboard/expense-tracking";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { SubscriptionsDetected } from "@/components/dashboard/subscriptions-detected";

interface DashboardClientProps {
    initialTransactions: any[];
    initialCreditCards: any[];
    initialAccounts: any[];
    initialCategories: any[];
    currentMonth: number;
    currentYear: number;
}

export function DashboardClient({
    initialTransactions,
    initialCreditCards,
    initialAccounts,
    initialCategories,
    currentMonth,
    currentYear
}: DashboardClientProps) {
    const queryClient = useQueryClient();

    useEffect(() => {
        queryClient.setQueryData(['transactions'], initialTransactions);
        queryClient.setQueryData(['creditCards'], initialCreditCards);
        queryClient.setQueryData(['accounts'], initialAccounts);
        queryClient.setQueryData(['categories'], initialCategories);
    }, [initialTransactions, initialCreditCards, initialAccounts, initialCategories, queryClient]);

    const { data: transactions } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => getTransactions(),
        initialData: initialTransactions,
    });

    const { data: creditCards } = useQuery({
        queryKey: ['creditCards'],
        queryFn: () => getCreditCards(),
        initialData: initialCreditCards,
    });

    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: () => getAccounts(),
        initialData: initialAccounts,
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => getCategories(),
        initialData: initialCategories,
    });

    const totalAccountBalance = accounts.reduce((acc: number, a: any) => acc + Number(a.balance), 0);
    const totalInvestments = accounts.reduce((acc: number, a: any) => acc + Number(a.investmentBalance), 0);

    const monthlyTransactions = transactions.filter((t: any) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
        .filter((t: any) => t.type === 'INCOME')
        .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

    const expense = monthlyTransactions
        .filter((t: any) => t.type === 'EXPENSE')
        .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

    const availableBalance = income - expense;

    const monthlyInvoices = creditCards.reduce((acc: number, card: any) => {
        const cardSpent = (card.transactions || [])
            .filter((tx: any) => {
                const d = new Date(tx.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0);
        return acc + cardSpent;
    }, 0);

    const chartData = [];
    const monthsStr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let i = 2; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth, 1);
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();

        const monthTxs = transactions.filter((t: any) => {
            const td = new Date(t.date);
            return td.getMonth() === m && td.getFullYear() === y;
        });

        const mIncome = monthTxs.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);
        const mExpense = monthTxs.filter((t: any) => t.type === 'EXPENSE').reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

        chartData.push({
            name: monthsStr[m],
            receita: mIncome,
            despesa: mExpense
        });
    }

    const allUnpaidCreditTransactions = transactions
        .filter((t: any) => t.creditCardId && !t.isPaid)
        .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

    const realLiquidity = totalAccountBalance + totalInvestments - allUnpaidCreditTransactions;

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-4 md:p-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                        Dashboard AI <Sparkles className="h-5 w-5 text-cyan-400 ai-glow-badge" />
                    </h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Visão Geral do seu patrimônio</p>
                </div>
                <div className="flex items-center gap-3">
                    <MonthFilter currentMonth={currentMonth} currentYear={currentYear} />
                    <TransactionModal categories={categories} creditCards={creditCards} accounts={accounts} />
                </div>
            </header>

            {/* Top Cards Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="glass p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Wallet className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-black uppercase">Seguro</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Saldo Líquido Real</p>
                    <h3 className={cn("text-2xl font-black mt-1", realLiquidity >= 0 ? "text-white" : "text-red-500")}>
                        {realLiquidity.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>

                <div className="glass p-6 border-l-4 border-l-purple-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                        </div>
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-black uppercase flex items-center gap-1">
                            <Zap className="w-2 h-2 fill-current" /> AI Glow
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Investido</p>
                    <h3 className="text-2xl font-black text-white mt-1">
                        {totalInvestments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>

                <div className="glass p-6 border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <CreditCard className="h-5 w-5 text-orange-500" />
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fatura do Mês</p>
                    <h3 className="text-2xl font-black text-white mt-1">
                        {monthlyInvoices.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>

                <div className="glass p-6 border-l-4 border-l-cyan-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <DollarSign className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="flex -space-x-1">
                            <div className="w-5 h-5 rounded-full border border-zinc-900 bg-cyan-500/20 flex items-center justify-center">
                                <Sparkles className="w-2 h-2 text-cyan-400" />
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Resultado do Mês</p>
                    <h3 className={cn("text-2xl font-black mt-1", availableBalance >= 0 ? "text-cyan-400" : "text-red-500")}>
                        {availableBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                </div>
            </div>

            {/* AI Insights Section */}
            <AIInsights />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4 glass p-8">
                    <Overview data={chartData} />
                </div>

                <div className="lg:col-span-3 glass p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight">
                            <Activity className="h-5 w-5 text-cyan-400" />
                            Atividades Recentes
                        </h4>
                        <button className="text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-colors">Ver Todas</button>
                    </div>
                    <div className="space-y-6">
                        {monthlyTransactions.slice(0, 5).map((tx: any) => (
                            <div key={tx.id} className="flex items-center group">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/5",
                                    tx.type === 'INCOME' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                )}>
                                    <Activity className={cn("h-4 w-4", tx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500')} />
                                </div>
                                <div className="ml-4 flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-100 truncate">{tx.description}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">
                                        {tx.category?.name || "Sem categoria"} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className={cn("ml-auto font-black text-sm", tx.type === 'INCOME' ? 'text-emerald-400' : 'text-white')}>
                                    {tx.type === 'INCOME' ? '+' : '-'}{Math.abs(Number(tx.amount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        ))}
                        {monthlyTransactions.length === 0 && (
                            <div className="text-sm text-center text-zinc-500 py-10 italic">Nenhuma transação este mês.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Subscriptions section */}
            <SubscriptionsDetected />

            {/* Secondary Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <LifeAtAGlance transactions={transactions} creditCards={creditCards} />
                <ExpenseTracking
                    transactions={transactions}
                    categories={categories}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                />
            </div>

            {/* Financial Health Projection */}
            <FinancialProjection
                accounts={accounts}
                transactions={transactions}
            />
        </div>
    );
}

