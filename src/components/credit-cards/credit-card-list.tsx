"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard as CreditCardIcon, Calendar, ChevronUp, ChevronDown, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCardActions } from "@/components/credit-cards/credit-card-actions";
import { reorderCreditCards } from "@/actions/credit-card";
import { toast } from "sonner";
import { TransactionModal } from "@/components/modals/transaction-modal";
import Link from "next/link";
import { LayoutGrid, List, ArrowDownUp, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CreditCardListProps {
    initialCards: any[];
    accounts: any[];
    categories: any[];
}

export function CreditCardList({ initialCards, accounts, categories }: CreditCardListProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'manual' | 'name' | 'invoice' | 'due' | 'limit'>('manual');
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;

        // Reordering visually during drag
        const items = [...initialCards];
        const draggedItem = items[draggedIdx];
        items.splice(draggedIdx, 1);
        items.splice(index, 0, draggedItem);
        // We'd map this to a local state ideally, but mutating active order immediately creates a nice feel without complex libs.
        // Let's implement visual swap simply by triggering the handleDrop mentally or relying on the DB call.
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === dropIndex) return;

        const newCards = [...initialCards];
        const draggedItem = newCards[draggedIdx];
        newCards.splice(draggedIdx, 1);
        newCards.splice(dropIndex, 0, draggedItem);

        try {
            await reorderCreditCards(newCards.map(c => c.id));
            setSortBy('manual'); // force to manual if they dragged something
        } catch (error) {
            toast.error("Erro ao salvar ordem nativa");
        }
        setDraggedIdx(null);
    };

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const sortedCards = [...initialCards].sort((a, b) => {
        if (sortBy === 'manual') return 0; // keeps original order
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'limit') return Number(b.limit) - Number(a.limit);

        if (sortBy === 'due') return Number(a.dueDay) - Number(b.dueDay);

        // Invoice logic
        if (sortBy === 'invoice') {
            const invoiceA = (a.transactions || []).filter((tx: any) => new Date(tx.date).getMonth() === currentMonth).reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);
            const invoiceB = (b.transactions || []).filter((tx: any) => new Date(tx.date).getMonth() === currentMonth).reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);
            return invoiceB - invoiceA; // desc
        }
        return 0;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-purple-500 rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Meus Cartões</h3>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-white">
                                <ArrowDownUp className="w-4 h-4 mr-2" />
                                {sortBy === 'manual' ? "Ordem Manual" :
                                    sortBy === 'name' ? "Por Nome" :
                                        sortBy === 'invoice' ? "Maior Fatura" :
                                            sortBy === 'due' ? "Vencimento" : "Maior Limite"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300">
                            <DropdownMenuItem onClick={() => setSortBy('manual')} className="focus:bg-zinc-900 focus:text-white">Ordem Manual (Drag-Drop)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('name')} className="focus:bg-zinc-900 focus:text-white">Nome do Cartão (A-Z)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('invoice')} className="focus:bg-zinc-900 focus:text-white">Valor da Fatura Atual</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('due')} className="focus:bg-zinc-900 focus:text-white">Data de Vencimento</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('limit')} className="focus:bg-zinc-900 focus:text-white">Maior Limite de Crédito</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-md p-1">
                        <Button
                            variant="ghost" size="sm"
                            className={`h-6 w-8 p-0 rounded-sm ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            className={`h-6 w-8 p-0 rounded-sm ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {sortedCards.map((card, index) => {
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
                        <div
                            key={card.id}
                            className={`group relative transition-all duration-300 ${draggedIdx === index ? 'opacity-50 scale-95' : ''}`}
                            draggable={sortBy === 'manual'}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                        >
                            <Card className={`overflow-hidden border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-all ${viewMode === 'list' ? 'flex flex-col xl:flex-row min-h-32' : 'flex flex-col h-full'}`}>
                                <div className={`p-6 flex flex-col justify-between shrink-0 ${viewMode === 'list' ? 'xl:w-72 h-auto xl:h-auto' : 'h-32'}`} style={{ background: `linear-gradient(to bottom right, ${card.color || '#8b5cf6'}, #18181b)` }}>
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-white/90 truncate mr-2">{card.name}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {sortBy === 'manual' && viewMode === 'grid' && (
                                                <div className="flex bg-black/20 rounded-lg p-1 border border-white/10 mr-1 backdrop-blur-md cursor-grab active:cursor-grabbing hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                                                    <GripVertical className="h-4 w-4" />
                                                </div>
                                            )}
                                            <CreditCardActions creditCard={card} accounts={accounts} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="font-mono text-sm text-white/80 tracking-widest">•••• {card.id.substring(0, 4)}</span>
                                        {sortBy === 'manual' && viewMode === 'list' ? (
                                            <div className="cursor-grab active:cursor-grabbing text-white/60 hover:text-white transition-colors bg-black/20 rounded-lg py-1 px-3 border border-white/10 backdrop-blur-md flex items-center gap-2 text-xs font-bold uppercase">
                                                <GripVertical className="w-3 h-3" />
                                                Drag to Reorder
                                            </div>
                                        ) : (
                                            <span className="font-bold text-white italic">CARD</span>
                                        )}
                                    </div>
                                </div>

                                <CardContent className={`flex-1 flex flex-col xl:flex-row items-start xl:items-center gap-6 p-6 xl:py-4`}>
                                    <div className={`flex justify-between items-center w-full xl:w-auto xl:flex-1`}>
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
                                        <div className="flex xl:flex-col items-center xl:items-end gap-3 xl:gap-2">
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

                                    <div className="space-y-2 w-full xl:w-1/3 shrink-0">
                                        <div className="flex justify-between text-sm font-bold">
                                            <span className="text-muted-foreground uppercase tracking-tighter">Uso do Limite</span>
                                            <span className="text-purple-400">{percentUsed}%</span>
                                        </div>
                                        <Progress value={percentUsed} className="h-2 shadow-inner" indicatorClassName="bg-purple-500" />
                                        <div className="flex justify-between text-[11px] font-bold uppercase">
                                            <span className="text-zinc-300">{totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} usados</span>
                                            <span className="text-zinc-500">{limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} total</span>
                                        </div>
                                    </div>

                                    {card.goal && Number(card.goal) > 0 && (
                                        <div className={`space-y-2 w-full xl:w-1/3 shrink-0 ${viewMode !== 'list' ? 'mt-2 pt-4 border-t border-zinc-800/50' : 'xl:pl-6 xl:border-l border-zinc-800/50'}`}>
                                            {(() => {
                                                const goalVal = Number(card.goal);
                                                const healthPercent = Math.min(Math.round((totalMonthlySpent / goalVal) * 100), 100);
                                                const isCritical = healthPercent >= 90;
                                                const isWarning = healthPercent >= 70 && !isCritical;
                                                const barColor = isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500";
                                                const textColor = isCritical ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500";

                                                return (
                                                    <>
                                                        <div className="flex justify-between text-sm font-bold">
                                                            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-tighter">
                                                                <HeartPulse className={`w-3.5 h-3.5 ${textColor}`} /> Health Check
                                                            </span>
                                                            <span className={textColor}>{healthPercent}%</span>
                                                        </div>
                                                        <Progress value={healthPercent} className="h-2 shadow-inner" indicatorClassName={barColor} />
                                                        <div className="flex justify-between text-[11px] font-bold uppercase">
                                                            <span className="text-zinc-300">Fatura vs Meta</span>
                                                            <span className="text-zinc-500">Max {goalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}

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
            </div>
            {/* Removed CreditCardStatement modal usage as it is now a full page */}
        </div>
    );
}
