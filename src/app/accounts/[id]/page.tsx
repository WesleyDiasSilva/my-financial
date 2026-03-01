import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccountHealth } from "@/actions/account";
import { getTransactions } from "@/actions/transaction";
import { getCategories } from "@/actions/category";
import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { getGoals } from "@/actions/goal";
import { TransactionList } from "@/components/transactions/transaction-list";
import { ArrowLeft, Wallet, TrendingUp, HeartPulse, CalendarClock, CreditCard, Activity } from "lucide-react";
import Link from "next/link";
import { TransferButton } from "@/components/accounts/TransferButton";
import { InvestmentButton } from "@/components/accounts/InvestmentButton";

export default async function AccountDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const account = await prisma.account.findUnique({
        where: { id: resolvedParams.id, userId: session.user.id },
        include: { creditCards: true }
    });

    if (!account) redirect("/accounts");

    const health = await getAccountHealth(account.id);

    // Fetch all needed data for transactions list
    const allTransactions = await getTransactions();
    const categories = await getCategories();
    const creditCards = await getCreditCards();
    const accounts = await getAccounts();
    const goals = await getGoals();

    // Filter transactions for this specific account
    const accountCcs = account.creditCards.map(c => c.id);
    const accountTransactions = allTransactions.filter(tx =>
        tx.accountId === account.id || (tx.creditCardId && accountCcs.includes(tx.creditCardId))
    );

    // Get upcoming transactions 
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTransactions = accountTransactions
        .filter(tx => !tx.isPaid)
        .map(tx => ({ ...tx, isCardBill: false }));

    // Find credit card bills due today or near future
    const upcomingBills = creditCards
        .filter(c => c.accountId === account.id)
        .map(card => {
            const currentBill = card.transactions?.filter((t: any) => !t.isPaid && t.type === 'EXPENSE').reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
            if (currentBill > 0) {
                const closingDate = new Date();
                closingDate.setDate(card.closingDay);
                if (closingDate < today) {
                    closingDate.setMonth(closingDate.getMonth() + 1);
                }
                const dueDate = new Date();
                dueDate.setDate(card.dueDay);
                // Se o vencimento já passou neste mês, avançar para o próximo
                if (dueDate < today) {
                    dueDate.setMonth(dueDate.getMonth() + 1);
                }

                // If it's due today or in the future and hasn't been paid
                if (dueDate >= today) {
                    return {
                        id: `bill-${card.id}-${dueDate.getTime()}`,
                        description: `Fatura ${card.name}`,
                        amount: currentBill,
                        date: dueDate,
                        type: 'EXPENSE',
                        isPaid: false,
                        isCardBill: true,
                    } as any;
                }
            }
            return null;
        })
        .filter(Boolean);

    const upcoming = [...upcomingTransactions, ...upcomingBills]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    return (
        <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto pb-12">
            <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-4">
                    <Link href="/accounts" className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center opacity-80" style={{ backgroundColor: account.color ? `${account.color}20` : '#10b98120' }}>
                            <Wallet className="w-5 h-5" style={{ color: account.color || '#10b981' }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">{account.name}</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                                    {account.type === 'CHECKING' ? 'Conta Corrente' : account.type === 'INVESTMENT' ? 'Corretora' : 'Conta Poupança'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <TransferButton
                        currentAccountId={account.id}
                        accounts={accounts.map(a => ({ id: a.id, name: a.name, balance: Number(a.balance), type: a.type, color: a.color }))}
                    />
                    <InvestmentButton
                        accountId={account.id}
                        accountName={account.name}
                        balance={Number(account.balance)}
                        investmentBalance={Number(account.investmentBalance)}
                        goals={goals.map(g => ({ id: g.id, name: g.name }))}
                    />
                </div>
            </header>

            <div className="p-4 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800/50 flex items-center justify-between relative overflow-hidden group shadow-xl">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-zinc-400 mb-1 uppercase tracking-widest">Saldo Disponível</p>
                            <h3 className={`text-4xl font-black tracking-tight ${Number(account.balance) < 0 ? 'text-red-400' : 'text-white'}`}>
                                {Number(account.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h3>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center z-10">
                            <Wallet className="w-6 h-6 text-emerald-500" />
                        </div>
                        <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-500/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                    </div>

                    <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800/50 flex items-center justify-between relative overflow-hidden group shadow-xl">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-zinc-400 mb-1 uppercase tracking-widest">Valor Investido</p>
                            <h3 className="text-4xl font-black tracking-tight text-white">
                                {Number(account.investmentBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </h3>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center z-10">
                            <TrendingUp className="w-6 h-6 text-purple-400" />
                        </div>
                        <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 text-purple-500/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <section className="bg-zinc-950/50 border border-zinc-800/50 p-6 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold flex items-center gap-2 text-white">
                                    <HeartPulse className="w-5 h-5 text-emerald-500" />
                                    Saúde da Conta
                                </h4>
                            </div>
                            <div className="text-center py-4">
                                <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                                        <circle className="text-zinc-800" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
                                        <circle
                                            className={health.score >= 80 ? "text-emerald-500" : health.score >= 30 ? "text-amber-500" : "text-rose-500"}
                                            cx="64" cy="64" fill="transparent" r="58" stroke="currentColor"
                                            strokeDasharray="364.4"
                                            strokeDashoffset={364.4 - (364.4 * health.score) / 100}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                        ></circle>
                                    </svg>
                                    <div className="relative flex flex-col items-center justify-center translate-y-0.5">
                                        <span className="text-3xl font-black text-white leading-none tracking-tighter">{health.runway}</span>
                                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest leading-none mt-1">Dias</span>
                                    </div>
                                </div>
                                <p className="text-sm font-semibold mb-1 text-white">Score: {health.score}/100 ({health.status})</p>
                                <p className="text-[11px] text-zinc-500 leading-relaxed px-4 mt-2">
                                    {health.runway === "> 30"
                                        ? "Sua liquidez é suficiente para cobrir despesas previstas pelos próximos 30 dias."
                                        : `Sua liquidez dura aproximadamente ${health.runway} dias com os compromissos futuros.`}
                                </p>
                            </div>
                        </section>

                        <section className="bg-zinc-950/50 border border-zinc-800/50 p-6 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold flex items-center gap-2 text-white">
                                    <CalendarClock className="w-5 h-5 text-emerald-500" />
                                    Próximos Compromissos
                                </h4>
                            </div>
                            <div className="space-y-3">
                                {upcoming.length === 0 ? (
                                    <div className="text-center py-6 text-zinc-500 text-sm">
                                        Nenhum compromisso pendente nos próximos dias.
                                    </div>
                                ) : (
                                    upcoming.map(tx => (
                                        <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-400'}`}>
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{tx.description}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase">
                                                    Agendado: {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} {tx.isCardBill && '(Fatura)'}
                                                </p>
                                            </div>
                                            <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'} flex-shrink-0`}>
                                                {tx.type === 'INCOME' ? '+' : '-'} {Math.abs(Number(tx.amount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Link href={`/transactions?account=${account.id}&status=pending`} className="block w-full text-center mt-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                                Ver agenda completa
                            </Link>
                        </section>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-zinc-950/50 border border-zinc-800/50 p-6 rounded-2xl shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="font-bold flex items-center gap-2 text-white">
                                    <CreditCard className="w-5 h-5 text-emerald-500" />
                                    Cartões Vinculados
                                </h4>
                                <Link href="/credit-cards" className="text-xs font-bold text-emerald-500 hover:underline">
                                    Gerenciar cartões
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {creditCards.filter(c => c.accountId === account.id).length === 0 ? (
                                    <div className="col-span-full text-center py-8 text-zinc-500 text-sm border border-zinc-800 border-dashed rounded-xl">
                                        Nenhum cartão de crédito vinculado a esta conta.
                                    </div>
                                ) : (
                                    creditCards.filter(c => c.accountId === account.id).map(card => {
                                        const totalSpent = card.transactions?.filter((t: any) => !t.isPaid && t.type === 'EXPENSE').reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
                                        const limit = Number(card.limit);
                                        const usedPercentage = limit > 0 ? Math.min(100, (totalSpent / limit) * 100) : 0;

                                        return (
                                            <div key={card.id} className="p-6 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 relative overflow-hidden group">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div style={{ color: card.color || '#10b981' }}>
                                                        <CreditCard className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-sm">{card.name}</p>
                                                        <p className="text-xs font-bold text-white mt-1">Fechamento: dia {card.closingDay}</p>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                                                        <span>Fatura Atual</span>
                                                        <span>{totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {(limit / 1000).toFixed(0)}k</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full transition-all" style={{ width: `${usedPercentage}%`, backgroundColor: card.color || '#10b981' }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link href={`/credit-cards/${card.id}/statement`} className="flex-1 w-full text-center py-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold tracking-widest uppercase hover:bg-emerald-500/20 transition-all">
                                                        Acessar Fatura
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        <section className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h4 className="font-bold flex items-center gap-2 text-white">
                                    <CalendarClock className="w-5 h-5 text-emerald-500" />
                                    Extrato da Conta
                                </h4>
                            </div>
                            <div className="w-full px-2 pb-6">
                                <TransactionList
                                    transactions={accountTransactions}
                                    categories={categories}
                                    creditCards={creditCards}
                                    accounts={accounts}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
