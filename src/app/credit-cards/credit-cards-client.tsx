"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard as CreditCardIcon, Calendar } from "lucide-react";
import { CreditCardModal } from "@/components/modals/credit-card-modal";
import { CreditCardList } from "@/components/credit-cards/credit-card-list";
import { CreditCardProjectionsChart } from "@/components/credit-cards/credit-card-projections-chart";
import { Wallet, TrendingUp, CreditCard, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditCardsClientProps {
    initialCards: any[];
    initialAccounts: any[];
    initialCategories: any[];
}

export function CreditCardsClient({
    initialCards,
    initialAccounts,
    initialCategories
}: CreditCardsClientProps) {
    const queryClient = useQueryClient();

    const { data: cards } = useQuery({
        queryKey: ['creditCards'],
        queryFn: getCreditCards,
        initialData: initialCards,
    });

    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: getAccounts,
        initialData: initialAccounts,
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        initialData: initialCategories,
    });

    // Sync SSR updates from revalidatePath to React Query Cache
    useEffect(() => {
        queryClient.setQueryData(['creditCards'], initialCards);
        queryClient.setQueryData(['accounts'], initialAccounts);
        queryClient.setQueryData(['categories'], initialCategories);
    }, [initialCards, initialAccounts, initialCategories, queryClient]);

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthlyData = cards.reduce((acc: any, card: any) => {
        const monthTxs = (card.transactions || []).filter((tx: any) => {
            const d = new Date(tx.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const paid = monthTxs.filter((tx: any) => tx.isPaid).reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0);
        const unpaid = monthTxs.filter((tx: any) => !tx.isPaid).reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0);

        acc.total += (paid + unpaid);
        acc.paid += paid;
        acc.unpaid += unpaid;
        return acc;
    }, { total: 0, paid: 0, unpaid: 0 });

    const totalGlobalDebt = cards.reduce((acc: number, card: any) => {
        const debt = (card.transactions || [])
            .filter((tx: any) => !tx.isPaid)
            .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0);
        return acc + debt;
    }, 0);

    const totalCombinedLimit = cards.reduce((acc: number, card: any) => acc + Number(card.limit), 0);
    const totalAvailableLimit = Math.max(totalCombinedLimit - totalGlobalDebt, 0);

    return (
        <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Gestão de Crédito</h2>
                    <p className="text-zinc-500 font-medium mt-1 uppercase text-[10px] tracking-[2px]">Controle de limites, faturas e dívidas globais</p>
                </div>
                <CreditCardModal accounts={accounts} />
            </div>

            {/* Global Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <Card className="shadow-2xl border-zinc-800/50 bg-zinc-950/50 hover:border-orange-500/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CreditCard className="h-16 w-16 text-orange-500 -rotate-12" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Faturas do Mês</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white">{monthlyData.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-emerald-500">Pago: {monthlyData.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                <span className="text-orange-500">Pendente: {monthlyData.unpaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${monthlyData.total > 0 ? (monthlyData.paid / monthlyData.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-2xl border-zinc-800/50 bg-zinc-950/50 hover:border-red-500/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ArrowDownRight className="h-16 w-16 text-red-500 -rotate-12" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Dívida Global</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-400">{totalGlobalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <p className="text-[10px] uppercase font-bold text-zinc-600 mt-1">Total para quitar hoje</p>
                    </CardContent>
                </Card>

                <Card className="shadow-2xl border-zinc-800/50 bg-zinc-950/50 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wallet className="h-16 w-16 text-emerald-500 -rotate-12" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Limite Disponível</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-400">{totalAvailableLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <p className="text-[10px] uppercase font-bold text-zinc-600 mt-1">Poder de compra total</p>
                    </CardContent>
                </Card>

                <Card className="shadow-2xl border-zinc-800/50 bg-zinc-950/50 hover:border-zinc-500/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-16 w-16 text-zinc-500 -rotate-12" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Limite Global</CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-zinc-300">{totalCombinedLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <p className="text-[10px] uppercase font-bold text-zinc-600 mt-1">Somatória de todos os bancos</p>
                    </CardContent>
                </Card>
            </div>

            <CreditCardProjectionsChart cards={cards} />

            <CreditCardList initialCards={cards} accounts={accounts} categories={categories} />
        </div>
    );
}
