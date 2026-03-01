"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Calendar as CalendarIcon, Wallet as WalletIcon, FileText, Clock } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LifeAtAGlanceProps {
    transactions: any[];
    creditCards: any[];
}

export function LifeAtAGlance({ transactions, creditCards }: LifeAtAGlanceProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = addDays(today, 7);

    // Find upcoming pending transactions
    const pendingTransactions = transactions.filter((t: any) => {
        if (t.isPaid) return false;
        const d = new Date(t.date);
        return d >= today && d <= sevenDaysFromNow;
    }).map((t: any) => ({
        id: t.id,
        title: t.description,
        date: new Date(t.date),
        type: 'transaction',
        amount: Number(t.amount),
        isIncome: t.type === 'INCOME'
    }));

    // Find upcoming credit card invoices
    const upcomingInvoices = creditCards.map((c: any) => {
        const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), c.dueDay);
        // If due day is passed, check next month
        if (dueThisMonth < today) {
            dueThisMonth.setMonth(dueThisMonth.getMonth() + 1);
        }

        return {
            id: c.id,
            title: `Fatura ${c.name}`,
            date: dueThisMonth,
            type: 'invoice',
            amount: c.transactions?.reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0) || 0,
            isIncome: false
        };
    }).filter(i => i.date >= today && i.date <= sevenDaysFromNow);

    const allEvents = [...pendingTransactions, ...upcomingInvoices].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4);

    const formatEventDate = (date: Date) => {
        if (isToday(date)) return "Hoje";
        if (isTomorrow(date)) return "Amanhã";
        if (isThisWeek(date)) return format(date, "EEEE", { locale: ptBR });
        return format(date, "dd MMM", { locale: ptBR });
    };

    return (
        <div className="glass p-8 rounded-2xl border border-white/5">
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Clock className="h-5 w-5 text-orange-400" />
                Compromissos
            </h4>
            <div className="space-y-4">
                {allEvents.length === 0 ? (
                    <div className="text-sm text-zinc-500 text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                        Nenhum compromisso para os próximos 7 dias. Uhuul!
                    </div>
                ) : (
                    allEvents.map((event) => (
                        <div
                            key={`${event.type}-${event.id}`}
                            className={`p-4 rounded-xl flex items-center justify-between border-l-4 ${isToday(event.date) ? 'border-l-red-500' : 'border-l-orange-400'} bg-white/5 hover:bg-white/10 transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                                    {event.type === 'invoice' ? <FileText className="h-4 w-4 text-zinc-400" /> : <WalletIcon className="h-4 w-4 text-zinc-400" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-100">{event.title}</p>
                                    <p className={`text-[9px] font-bold uppercase ${isToday(event.date) ? 'text-red-500' : 'text-zinc-500'}`}>
                                        {isToday(event.date) ? "Vence Hoje" : `Vence em ${formatEventDate(event.date)}`}
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-white">
                                {event.isIncome ? '+' : '-'}{event.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    ))
                )}
            </div>
            <button className="w-full mt-6 text-[10px] font-black py-3 rounded-lg border border-white/5 hover:bg-white/5 uppercase transition-all tracking-widest text-zinc-400">
                Ver Calendário
            </button>
        </div>
    );
}

