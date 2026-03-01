import { getAccounts, getAccountHealth } from "@/actions/account";
import { AccountModal } from "@/components/modals/account-modal";
import { TrendingUp, Landmark, Plus, BarChart3, Rocket, Target, CreditCard, Wallet } from "lucide-react";
import { AccountActions } from "@/components/accounts/account-actions";
import { AccountList } from "@/components/accounts/account-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NetWorthEvolution } from "@/components/accounts/net-worth-evolution";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AccountsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const rawAccounts = await getAccounts();

    // Fetch health for each account
    const accounts = await Promise.all(
        rawAccounts.map(async (acc) => ({
            ...acc,
            health: await getAccountHealth(acc.id)
        }))
    );

    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance + curr.investmentBalance, 0);
    const totalInvestments = accounts.reduce((acc, curr) => acc + curr.investmentBalance, 0);
    const checkingBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

    // Calculate 12 months history
    const allTxs = await prisma.transaction.findMany({
        where: { userId: session.user.id, isPaid: true },
        select: { amount: true, type: true, date: true, accountId: true }
    });

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();

    // Group net flow by YYYY-MM
    const flowsByMonth: Record<string, number> = {};
    for (const tx of allTxs) {
        if (!tx.accountId) continue; // Only count account transactions for net worth flow
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const amount = Number(tx.amount);
        flowsByMonth[key] = (flowsByMonth[key] || 0) + (tx.type === 'INCOME' ? amount : -amount);
    }

    const historyData = [];
    let runningBalance = totalBalance;

    let monthsToProcess = 12;
    if (allTxs.length > 0) {
        const oldestTx = new Date(Math.min(...allTxs.map(t => new Date(t.date).getTime())));
        monthsToProcess = (now.getFullYear() - oldestTx.getFullYear()) * 12 + (now.getMonth() - oldestTx.getMonth()) + 1;
        monthsToProcess = Math.max(12, Math.min(monthsToProcess, 60)); // Between 12 and 60 months (5 years)
    }

    // We go backwards from current month up to the calculated limit
    for (let i = 0; i < monthsToProcess; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthStr = months[d.getMonth()];

        historyData.unshift({
            monthStr,
            netWorth: Math.max(0, runningBalance), // Avoid negative for chart sake
            dateKey: key
        });

        // Subtract the flow of this exact month to get the balance at the end of the previous month
        runningBalance -= (flowsByMonth[key] || 0);
    }

    return (
        <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-12">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 mb-8 w-full">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Minhas Contas</h2>
                    <p className="text-zinc-400 mt-1">Gerencie seu patrimônio e saúde financeira em tempo real.</p>
                </div>
                <AccountModal trigger={
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20">
                        <Plus className="w-4 h-4" />
                        Nova Conta
                    </Button>
                } />
            </header>

            <section className="grid grid-cols-12 gap-6 mb-8 w-full">
                {/* Evolução Patrimonial (Gráfico Dinâmico) */}
                <NetWorthEvolution history={historyData} />

                {/* 3 Metrics Cards */}
                <div className="col-span-12 lg:col-span-5 grid grid-rows-3 gap-4 w-full">
                    {/* Patrimônio Total */}
                    <div className="bg-zinc-950 border border-zinc-800/50 p-5 rounded-2xl relative overflow-hidden group shadow-xl">
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Patrimônio Total</span>
                            <div className="text-2xl font-bold font-mono text-white flex items-center gap-1">
                                {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                        <Wallet className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    {/* Total Disponível */}
                    <div className="bg-zinc-950 border border-zinc-800/50 p-5 rounded-2xl relative overflow-hidden group shadow-xl">
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Total Disponível</span>
                            <div className="text-2xl font-bold font-mono text-zinc-100 flex items-center gap-1">
                                {checkingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                        <Landmark className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    {/* Total Investido */}
                    <div className="bg-zinc-950 border border-zinc-800/50 p-5 rounded-2xl relative overflow-hidden group shadow-xl">
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Total Investido</span>
                            <div className="text-2xl font-bold font-mono text-zinc-100 flex items-center gap-1">
                                {totalInvestments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                        <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-purple-500 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </div>
            </section>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white w-full">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                Contas Ativas
            </h3>

            <div className="w-full">
                <AccountList initialAccounts={accounts} />
            </div>

            {/* Banner Planejador de Metas */}
            <div className="mt-12 bg-gradient-to-r from-emerald-900/10 to-indigo-900/10 border border-emerald-900/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-900/20 flex flex-shrink-0 items-center justify-center text-emerald-500">
                        <Rocket className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white mb-1">Planejador de Metas 2026</h4>
                        <p className="text-sm text-zinc-400 max-w-xl">Configure suas metas e objetivos para ver sua reserva crescer e alcançar a liberdade financeira.</p>
                    </div>
                </div>
                <Link href="/goals">
                    <Button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white whitespace-nowrap px-6 py-5 rounded-xl text-sm font-semibold transition-all">
                        <Target className="w-4 h-4 mr-2" />
                        Configurar Metas
                    </Button>
                </Link>
            </div>
        </div>
    );
}
