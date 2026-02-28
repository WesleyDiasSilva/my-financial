"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShoppingCart, Banknote, ArrowUpDown, ChevronDown } from "lucide-react";
import { CategoryActions } from "./category-actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PlanningListProps {
    title: string;
    type: 'EXPENSE' | 'INCOME';
    items: any[];
    transactions: any[];
    sortBy: string;
    sortOrder: string;
}

export function PlanningList({ title, type, items, transactions, sortBy, sortOrder }: PlanningListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isIncome = type === 'INCOME';

    const getCatStats = (cat: any) => {
        const catTxs = transactions.filter((t: any) => t.categoryId === cat.id);
        const total = catTxs.reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);
        const limit = cat.monthlyLimit ? Number(cat.monthlyLimit) : null;
        const percent = limit && limit > 0 ? Math.min(Math.round((total / limit) * 100), 100) : null;
        return { total, limit, percent };
    };

    // Calculate stats for all items to sort
    const itemsWithStats = items.map(cat => ({
        ...cat,
        stats: getCatStats(cat)
    }));

    // Sorting logic
    const sortedItems = [...itemsWithStats].sort((a, b) => {
        let valA, valB;
        if (sortBy === 'meta') {
            valA = a.stats.limit || 0;
            valB = b.stats.limit || 0;
        } else if (sortBy === 'real') {
            valA = a.stats.total;
            valB = b.stats.total;
        } else {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const setSort = (newSortBy: string) => {
        const params = new URLSearchParams(searchParams);
        if (sortBy === newSortBy) {
            params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            params.set('sortBy', newSortBy);
            params.set('sortOrder', 'desc'); // Default to desc for amounts
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-2xl", isIncome ? "bg-emerald-500/10" : "bg-red-500/10")}>
                        {isIncome ? <Banknote className="h-6 w-6 text-emerald-500" /> : <ShoppingCart className="h-6 w-6 text-red-500" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase">{title}</h3>
                        <p className="text-xs text-zinc-500 font-bold">{items.length} Categorias mapeadas</p>
                    </div>
                </div>

                {items.length > 0 && (
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 font-bold text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white">
                                    <ArrowUpDown className="h-3 w-3 mr-2" /> Ordenar: {sortBy === 'meta' ? 'Meta' : sortBy === 'real' ? (isIncome ? 'Recebido' : 'Gasto') : 'Nome'}
                                    <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300">
                                <DropdownMenuItem onSelect={() => setSort('name')} className="font-bold text-xs uppercase tracking-tighter cursor-pointer">Por Nome</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setSort('meta')} className="font-bold text-xs uppercase tracking-tighter cursor-pointer">Por Valor Meta</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setSort('real')} className="font-bold text-xs uppercase tracking-tighter cursor-pointer">Por Valor {isIncome ? 'Recebido' : 'Real'}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            <div className="grid gap-3">
                {items.length === 0 ? (
                    <div className="py-20 border border-dashed border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center text-center bg-zinc-900/10">
                        <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest">Nenhuma categoria encontrada nesta seção.</p>
                    </div>
                ) : (
                    sortedItems.map((cat) => {
                        const { total, limit, percent } = cat.stats;
                        const isOverLimit = limit !== null && total > limit;

                        return (
                            <div key={cat.id} className="group flex items-center gap-6 p-6 bg-zinc-950/40 border border-zinc-900/50 hover:border-zinc-700/50 hover:bg-zinc-900/40 rounded-[2rem] transition-all overflow-hidden">
                                {/* Visual Indicator */}
                                <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 border border-zinc-800 shadow-2xl" style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}40` }}>
                                    {isIncome ? <Banknote className="h-8 w-8" style={{ color: cat.color }} /> : <ShoppingCart className="h-8 w-8" style={{ color: cat.color }} />}
                                </div>

                                {/* Name & Badges */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-xl font-black text-white leading-tight line-clamp-2 tracking-tighter">{cat.name}</h4>
                                            <div className="hidden xl:flex gap-2 shrink-0">
                                                {cat.isRequired && <span className="text-[9px] font-black uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">Essencial</span>}
                                                {cat.isFixed && <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">Fixo</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        {limit ? (
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-2 bg-zinc-900 rounded-full max-w-[120px] overflow-hidden border border-zinc-800">
                                                    <div className={cn("h-full rounded-full transition-all duration-700 ease-out", isOverLimit ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${percent}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
                                                    {percent}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter italic opacity-50">Sem meta</span>
                                        )}
                                    </div>
                                </div>

                                {/* Values & Actions */}
                                <div className="flex items-center gap-8 shrink-0 border-l border-zinc-900/50 pl-8">
                                    <div className="text-right min-w-[140px] flex flex-col gap-3">
                                        {!isIncome && limit && (
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-zinc-500 mb-0.5">Meta</p>
                                                <p className="text-lg font-bold text-zinc-300 tracking-tight leading-tight">
                                                    {limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-zinc-500 mb-0.5">
                                                {isIncome ? 'Recebido' : 'Gasto Real'}
                                            </p>
                                            <p className={cn("text-2xl font-black tracking-tighter leading-tight", isOverLimit ? "text-red-400" : (isIncome ? "text-emerald-400" : "text-white"))}>
                                                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>
                                    <CategoryActions category={cat} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
