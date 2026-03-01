"use client";

import { useState } from "react";
import { Landmark, TrendingUp, Wallet, GripVertical } from "lucide-react";
import { AccountActions } from "@/components/accounts/account-actions";
import Link from "next/link";
import { reorderAccounts } from "@/actions/account";
import { toast } from "sonner";

interface AccountListProps {
    initialAccounts: any[];
}

export function AccountList({ initialAccounts }: AccountListProps) {
    const [accounts, setAccounts] = useState(initialAccounts);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;

        const items = [...accounts];
        const draggedItem = items[draggedIdx];
        items.splice(draggedIdx, 1);
        items.splice(index, 0, draggedItem);
        setAccounts(items);
        setDraggedIdx(index);
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        setDraggedIdx(null);

        try {
            await reorderAccounts(accounts.map(acc => acc.id));
            toast.success("Ordem das contas atualizada");
        } catch (error) {
            toast.error("Erro ao salvar nova ordem");
            // Reverse on error
            setAccounts(initialAccounts);
        }
    };

    if (accounts.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center py-12 border border-zinc-800/50 border-dashed rounded-lg bg-zinc-900/20">
                <Wallet className="h-12 w-12 text-zinc-700 mb-4" />
                <p className="text-zinc-500 font-medium text-lg">Nenhuma conta cadastrada.</p>
                <p className="text-zinc-600 mb-4">Adicione suas contas para começar a controlar seu saldo.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            {accounts.map((account, index) => {
                const healthScore = account.health?.score ?? 0;
                const healthStatus = account.health?.status ?? "Inativa";

                let healthColor = "bg-zinc-400";
                let healthBg = "bg-zinc-400/10 text-zinc-400";
                if (healthStatus === "Excelente") { healthColor = "bg-emerald-500"; healthBg = "bg-emerald-500/10 text-emerald-500"; }
                else if (healthStatus === "Atenção") { healthColor = "bg-amber-500"; healthBg = "bg-amber-500/10 text-amber-500"; }
                else if (healthStatus === "Crítico") { healthColor = "bg-rose-500"; healthBg = "bg-rose-500/10 text-rose-500"; }

                return (
                    <div
                        key={account.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`group transition-all duration-300 ${draggedIdx === index ? 'opacity-50 scale-95' : ''}`}
                    >
                        <Link href={`/accounts/${account.id}`} className="block">
                            <div className="bg-zinc-950 border-t-4 border border-x-zinc-800 border-b-zinc-800 rounded-xl p-5 shadow-sm account-card-hover relative" style={{ borderTopColor: account.color || '#10b981' }}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex bg-black/20 rounded-lg p-1 border border-white/10 mr-1 backdrop-blur-md cursor-grab active:cursor-grabbing hover:bg-white/10 text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100" onClick={(e) => e.preventDefault()}>
                                            <GripVertical className="h-4 w-4" />
                                        </div>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account.color || '#10b981', boxShadow: `0 0 8px ${account.color || '#10b981'}` }}></div>
                                        <div>
                                            <h4 className="font-bold text-base text-white leading-none">{account.name}</h4>
                                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                                                {account.type === 'CHECKING' ? 'Conta Corrente' : account.type === 'INVESTMENT' ? 'Corretora' : 'Poupança'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative z-20" onClick={(e) => e.preventDefault()}>
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
                    </div>
                );
            })}
        </div>
    );
}
