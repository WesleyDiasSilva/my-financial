import { getAccounts, getAccountHealth } from "@/actions/account";
import { AccountModal } from "@/components/modals/account-modal";
import { TrendingUp, Landmark, Plus, BarChart3, Rocket, Target, CreditCard, Wallet } from "lucide-react";
import { AccountActions } from "@/components/accounts/account-actions";
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                {accounts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 border border-zinc-800/50 border-dashed rounded-lg bg-zinc-900/20">
                        <Wallet className="h-12 w-12 text-zinc-700 mb-4" />
                        <p className="text-zinc-500 font-medium text-lg">Nenhuma conta cadastrada.</p>
                        <p className="text-zinc-600 mb-4">Adicione suas contas para começar a controlar seu saldo.</p>
                        <AccountModal trigger={<Button variant="outline" className="border-zinc-800">Adicionar Conta</Button>} />
                    </div>
                ) : (
                    accounts.map((account: any) => {
                        const healthScore = account.health?.score ?? 0;
                        const healthStatus = account.health?.status ?? "Inativa";

                        let healthColor = "bg-zinc-400";
                        let healthBg = "bg-zinc-400/10 text-zinc-400";
                        if (healthStatus === "Excelente") { healthColor = "bg-emerald-500"; healthBg = "bg-emerald-500/10 text-emerald-500"; }
                        else if (healthStatus === "Atenção") { healthColor = "bg-amber-500"; healthBg = "bg-amber-500/10 text-amber-500"; }
                        else if (healthStatus === "Crítico") { healthColor = "bg-rose-500"; healthBg = "bg-rose-500/10 text-rose-500"; }

                        return (
                            <Link href={`/accounts/${account.id}`} key={account.id} className="block group">
                                <div className="bg-zinc-950 border-t-4 border border-x-zinc-800 border-b-zinc-800 rounded-xl p-5 shadow-sm account-card-hover relative" style={{ borderTopColor: account.color || '#10b981' }}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account.color || '#10b981', boxShadow: `0 0 8px ${account.color || '#10b981'}` }}></div>
                                            <div>
                                                <h4 className="font-bold text-base text-white leading-none">{account.name}</h4>
                                                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                                                    {account.type === 'CHECKING' ? 'Conta Corrente' : account.type === 'INVESTMENT' ? 'Corretora' : 'Poupança'}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Dropdown 3 pontinhos */}
                                        <div className="relative z-20">
                                            <AccountActions account={account} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Saldo Disponível</p>
                                            <p className={`text-lg font-bold font-mono ${account.balance < 0 ? 'text-red-400' : 'text-zinc-100'}`}>
                                                {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1 flex items-center justify-end gap-1">
                                                INVESTIDO <TrendingUp className="w-3 h-3 text-purple-400" />
                                            </p>
                                            <p className="text-base font-semibold font-mono text-purple-400">
                                                {account.investmentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-800/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Health Score</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-zinc-400">{healthScore}/100</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${healthBg}`}>
                                                    {healthStatus}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${healthColor} transition-all duration-1000`} style={{ width: `${Math.max(5, healthScore)}%` }}></div>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-2">
                                            {healthStatus === "Excelente" ? "Saldo provável cobre as contas dos próximos 30 dias." :
                                                healthStatus === "Atenção" ? "Fique atento, seu saldo pode ficar muito baixo ou comprometer-se." :
                                                    healthStatus === "Crítico" ? "Risco alto: o saldo futuro previso é negativo nos próximos dias." : "Sem movimentações pendentes detectadas."}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
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
