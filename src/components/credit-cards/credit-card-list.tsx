"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard as CreditCardIcon, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCardActions } from "@/components/credit-cards/credit-card-actions";
import { reorderCreditCards } from "@/actions/credit-card";
import { toast } from "sonner";
import { TransactionModal } from "@/components/modals/transaction-modal";
import Link from "next/link";

interface CreditCardListProps {
    initialCards: any[];
    accounts: any[];
    categories: any[];
}

export function CreditCardList({ initialCards, accounts, categories }: CreditCardListProps) {
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newCards = [...initialCards];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newCards.length) return;

        // Swap
        [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];

        // In a real scenario we'd optimistically update cache here.
        // But for simplicity, we call API and trigger re-render on parent
        try {
            await reorderCreditCards(newCards.map(c => c.id));
            // Let the invalidateQueries inside CreditCardActions or parent handle refetch
            // Usually we'd need useQueryClient here but since it's just order, 
            // a page reload or generic refresh is enough if not implemented optimistically.
        } catch (error) {
            toast.error("Erro ao salvar nova ordem");
        }
    };

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="h-4 w-1 bg-purple-500 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Seus Cartões</h3>
            </div>
            {initialCards.map((card, index) => {
                const unpaidMonthlySpent = (card.transactions || [])
                    .filter((tx: any) => {
                        const d = new Date(tx.date);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !tx.isPaid;
                    })
                    .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

                const totalMonthlySpent = (card.transactions || [])
                    .filter((tx: any) => {
                        const d = new Date(tx.date);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    })
                    .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

                const totalDebt = (card.transactions || [])
                    .filter((tx: any) => !tx.isPaid)
                    .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

                const limit = Number(card.limit);
                const percentUsed = limit > 0 ? Math.min(Math.round((totalDebt / limit) * 100), 100) : 0;
                const available = Math.max(limit - totalDebt, 0);

                return (
                    <div key={card.id} className="group relative">
                        <Card className="overflow-hidden border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-all">
                            <div className="h-32 p-6 flex flex-col justify-between" style={{ background: `linear-gradient(to bottom right, ${card.color || '#8b5cf6'}, #18181b)` }}>
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-white/90">{card.name}</span>
                                    <div className="flex items-center gap-1">
                                        <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/10 mr-1 backdrop-blur-md">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                                                onClick={() => handleMove(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <ChevronUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                                                onClick={() => handleMove(index, 'down')}
                                                disabled={index === initialCards.length - 1}
                                            >
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <CreditCardActions creditCard={card} accounts={accounts} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="font-mono text-sm text-white/80 tracking-widest">•••• {card.id.substring(0, 4)}</span>
                                    <span className="font-bold text-white italic">CARD</span>
                                </div>
                            </div>

                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Fatura do Mês</p>
                                        <span className="text-2xl font-black text-foreground">
                                            {totalMonthlySpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-black uppercase">
                                            <span className="text-orange-500">Pendente: {unpaidMonthlySpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            <span className="text-zinc-600">Total Devido: {totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <TransactionModal
                                            categories={categories}
                                            creditCards={initialCards}
                                            accounts={accounts}
                                            isCreditCardOnly={true}
                                            fixedCreditCardId={card.id}
                                            trigger={
                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tighter bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-blue-400 border-blue-400/20">
                                                    + Lançar Gasto
                                                </Button>
                                            }
                                        />
                                        <Link href={`/credit-cards/${card.id}/statement`} className="w-full">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-full text-[10px] font-black uppercase tracking-tighter text-zinc-400 hover:text-white"
                                            >
                                                Ver Extrato
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-muted-foreground uppercase tracking-tighter">Uso do Limite</span>
                                        <span className="text-purple-400">{percentUsed}%</span>
                                    </div>
                                    <Progress value={percentUsed} className="h-2 [&>div]:bg-purple-500 shadow-inner" />
                                    <div className="flex justify-between text-[11px] font-bold uppercase">
                                        <span className="text-zinc-300">{totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} usados</span>
                                        <span className="text-zinc-500">{limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} total</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-800/50 grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-zinc-900 p-2 rounded-md">
                                            <Calendar className="h-4 w-4 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Fechamento</p>
                                            <p className="text-sm font-medium">Dia {card.closingDay}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-zinc-900 p-2 rounded-md">
                                            <Calendar className="h-4 w-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Vencimento</p>
                                            <p className="text-sm font-medium">Dia {card.dueDay}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
            {initialCards.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/20">
                    <CreditCardIcon className="h-12 w-12 text-zinc-700 mb-4" />
                    <p className="text-zinc-500 font-medium text-lg">Nenhum cartão cadastrado.</p>
                    <p className="text-zinc-600">Adicione seus cartões para acompanhar as faturas.</p>
                </div>
            )}
            {/* Removed CreditCardStatement modal usage as it is now a full page */}
        </div>
    );
}
