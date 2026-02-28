"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ChevronLeft,
    ChevronRight,
    Receipt,
    Calendar,
    CreditCard as CardIcon,
    ArrowLeft,
    Trash2,
    Edit3,
    MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { deleteTransaction } from "@/actions/transaction";
import { toast } from "sonner";
import { TransactionModal } from "@/components/modals/transaction-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatementClientProps {
    card: any;
    categories: any[];
    creditCards: any[];
    accounts: any[];
}

export function StatementClient({ card, categories, creditCards, accounts }: StatementClientProps) {
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const monthTransactions = card.transactions.filter((tx: any) => {
        const d = new Date(tx.date);
        return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
    });

    const totalAmount = monthTransactions.reduce((acc: number, tx: any) => acc + Math.abs(Number(tx.amount)), 0);
    const paidAmount = monthTransactions.filter((tx: any) => tx.isPaid).reduce((acc: number, tx: any) => acc + Math.abs(Number(tx.amount)), 0);
    const pendingAmount = totalAmount - paidAmount;

    const navigateMonth = (direction: 'next' | 'prev') => {
        const newDate = new Date(selectedMonth);
        newDate.setMonth(selectedMonth.getMonth() + (direction === 'next' ? 1 : -1));
        setSelectedMonth(newDate);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
        try {
            await deleteTransaction(id);
            toast.success("Lançamento excluído!");
            // Note: Since this is a client component and we're using server actions, 
            // revalidatePath in the action should handle the refresh if this were a server component.
            // For client-side logic, we might need to trigger a router refresh or manually filter.
            window.location.reload(); // Simple way to refresh data
        } catch (error) {
            toast.error("Erro ao excluir lançamento");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/credit-cards">
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Receipt className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Extrato Detalhado</h1>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: card.color || '#3b82f6' }} />
                                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{card.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-sm self-start md:self-center">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white" onClick={() => navigateMonth('prev')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col items-center min-w-[140px]">
                        <span className="text-xs font-black text-zinc-100 uppercase tracking-tighter capitalize">
                            {format(selectedMonth, "MMMM", { locale: ptBR })}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500">
                            {format(selectedMonth, "yyyy")}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white" onClick={() => navigateMonth('next')}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="group bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl hover:border-zinc-700 transition-all shadow-lg hover:shadow-black/50">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-zinc-800 rounded-lg">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        </div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-[11px]">Total da Fatura</p>
                    </div>
                    <p className="text-3xl font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">
                        {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                <div className="group bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl hover:border-emerald-500/20 transition-all shadow-lg hover:shadow-emerald-950/20">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                            <CardIcon className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-[11px]">Efetuado / Pago</p>
                    </div>
                    <p className="text-3xl font-black text-emerald-400 font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">
                        {paidAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                <div className="group bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl hover:border-orange-500/20 transition-all shadow-lg hover:shadow-orange-950/20">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-orange-500/10 rounded-lg">
                            <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        </div>
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest text-[11px]">Lançamentos Pendentes</p>
                    </div>
                    <p className="text-3xl font-black text-orange-400 font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">
                        {pendingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-zinc-900 bg-zinc-900/20">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-[3px] text-zinc-400">Lançamentos</h2>
                        <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2.5 py-1 rounded-full">{monthTransactions.length} itens</span>
                    </div>
                </div>

                <div className="divide-y divide-zinc-900">
                    {monthTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-zinc-600 space-y-4">
                            <div className="p-4 bg-zinc-900/50 rounded-full">
                                <Calendar className="h-10 w-10 opacity-20" />
                            </div>
                            <p className="text-lg font-bold italic">Nenhum lançamento encontrado para este período.</p>
                            <p className="text-sm">Seus gastos parcelados aparecerão aqui automaticamente.</p>
                        </div>
                    ) : (
                        monthTransactions.map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-6 hover:bg-zinc-900/30 transition-all group border-l-4 border-transparent hover:border-blue-500/30">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "p-4 rounded-2xl transition-all shadow-lg",
                                        tx.isPaid ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20" : "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20"
                                    )}>
                                        <CardIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-base font-black text-zinc-100 tracking-tight group-hover:text-white transition-colors">{tx.description}</p>
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700/50">
                                                {tx.category?.name || 'Sem Categoria'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <p className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 capitalize">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(tx.date), "dd 'de' MMMM", { locale: ptBR })}
                                            </p>
                                            <div className="h-1 w-1 rounded-full bg-zinc-800" />
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[2px]",
                                                tx.isPaid ? "text-emerald-500" : "text-orange-500"
                                            )}>
                                                {tx.isPaid ? 'Efetivado' : 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-xl font-black text-zinc-100 font-mono tracking-tight group-hover:scale-110 transition-transform origin-right">
                                            {Number(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <TransactionModal
                                            categories={categories}
                                            creditCards={creditCards}
                                            accounts={accounts}
                                            initialData={tx}
                                            isCreditCardOnly={true}
                                            trigger={
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all active:scale-90"
                                                >
                                                    <Edit3 className="h-4.5 w-4.5" />
                                                </Button>
                                            }
                                        />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(tx.id)}
                                            className="h-9 w-9 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-90"
                                        >
                                            <Trash2 className="h-4.5 w-4.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
