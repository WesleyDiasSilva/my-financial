"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calculator, TrendingDown, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface SimulatorProps {
    initialCards: any[];
    categories: any[];
    accounts: any[];
}

interface SimulatedPurchase {
    id: string;
    name: string;
    totalAmount: number;
    installments: number;
    categoryId: string;
}

export function SimulatorClient({ initialCards, categories, accounts }: SimulatorProps) {
    const [simulations, setSimulations] = useState<SimulatedPurchase[]>([]);

    // Form Input States
    const [simName, setSimName] = useState("");
    const [simAmount, setSimAmount] = useState("");
    const [simInstallments, setSimInstallments] = useState("1");
    const [simCategory, setSimCategory] = useState("");

    const handleAddSimulation = () => {
        if (!simName || !simAmount || !simCategory || Number(simInstallments) < 1) return;

        const newSim = {
            id: Math.random().toString(),
            name: simName,
            totalAmount: parseFloat(simAmount.replace(/\./g, '').replace(',', '.')),
            installments: parseInt(simInstallments),
            categoryId: simCategory
        };

        setSimulations([...simulations, newSim]);
        setSimName("");
        setSimAmount("");
        setSimInstallments("1");
        setSimCategory("");
    };

    const handleRemoveSimulation = (id: string) => {
        setSimulations(simulations.filter(s => s.id !== id));
    };

    // Calculate time frame (-2 to +3 months)
    const timeLabels = useMemo(() => {
        const today = new Date();
        return [-2, -1, 0, 1, 2, 3].map(offset => {
            const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
            return {
                offset,
                month: d.getMonth(),
                year: d.getFullYear(),
                label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
            };
        });
    }, []);

    // Process all transactions & simulated transactions
    const categoryData = useMemo(() => {
        const dataMap: Record<string, number[]> = {};

        categories.forEach(c => {
            dataMap[c.id] = [0, 0, 0, 0, 0, 0]; // 6 months array
        });

        // Current real transactions
        initialCards.forEach(card => {
            (card.transactions || []).forEach((tx: any) => {
                const txDate = new Date(tx.date);
                const mIdx = timeLabels.findIndex(l => l.month === txDate.getMonth() && l.year === txDate.getFullYear());
                if (mIdx !== -1 && tx.categoryId && dataMap[tx.categoryId]) {
                    dataMap[tx.categoryId][mIdx] += Math.abs(Number(tx.amount));
                }
            });
        });

        // Add simulated transactions
        simulations.forEach(sim => {
            if (dataMap[sim.categoryId]) {
                const installmentValue = sim.totalAmount / sim.installments;
                for (let i = 0; i < sim.installments; i++) {
                    const mIdx = timeLabels.findIndex(l => l.offset === i); // 0 (current) + i
                    if (mIdx !== -1) {
                        dataMap[sim.categoryId][mIdx] += installmentValue;
                    }
                }
            }
        });

        return categories.map(cat => ({
            ...cat,
            monthlyTotals: dataMap[cat.id],
            goalLimit: cat.limit || 0
        })).sort((a, b) => {
            // Sort by current month usage
            const currA = a.monthlyTotals[2];
            const currB = b.monthlyTotals[2];
            return currB - currA;
        });

    }, [initialCards, categories, simulations, timeLabels]);

    const globalChartData = timeLabels.map((lbl, idx) => {
        // Find top 3 categories by total lifetime value in this data snapshot
        const sortedCats = [...categoryData].sort((a, b) => b.monthlyTotals[idx] - a.monthlyTotals[idx]);
        const top3 = sortedCats.slice(0, 3);
        const othersSum = sortedCats.slice(3).reduce((acc, cat) => acc + cat.monthlyTotals[idx], 0);

        return {
            ...lbl,
            total: sortedCats.reduce((acc, cat) => acc + cat.monthlyTotals[idx], 0),
            top3,
            othersSum
        };
    });

    const maxGlobalTotal = Math.max(...globalChartData.map(d => d.total), 1);

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-10 pb-20">
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                <Link href="/credit-cards">
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800">
                        <ArrowLeft className="w-5 h-5 cursor-pointer" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                        <Calculator className="w-8 h-8 text-blue-500" />
                        Análise e Simulação de Dívidas
                    </h2>
                    <p className="text-zinc-500 font-medium mt-1 uppercase text-[10px] tracking-[2px]">Preveja o impacto de compras no seu orçamento mensal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Left Panel: Simulator Form */}
                <Card className="xl:col-span-1 shadow-2xl border-zinc-800/50 bg-zinc-950/80 h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-orange-500" /> Nova Dívida
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-500">Adicione compras hipotéticas para ver o impacto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Produto/Despesa</Label>
                            <Input placeholder="Ex: Macbook Pro" value={simName} onChange={e => setSimName(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Valor Total (R$)</Label>
                            <Input placeholder="0,00" value={simAmount} onChange={e => setSimAmount(e.target.value)} className="bg-zinc-900 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Parcelas</Label>
                            <Select value={simInstallments} onValueChange={setSimInstallments}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="1x" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <SelectItem key={i} value={`${i + 1}`}>{i + 1}x</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Categoria Afetada</Label>
                            <Select value={simCategory} onValueChange={setSimCategory}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#fff' }} />
                                                {cat.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleAddSimulation} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-xs mt-2">
                            Adicionar ao Simulador
                        </Button>

                        {/* Active Simulations List */}
                        {simulations.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-zinc-800/50 space-y-3">
                                <Label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Simulações Ativas</Label>
                                {simulations.map(sim => {
                                    const cat = categories.find(c => c.id === sim.categoryId);
                                    return (
                                        <div key={sim.id} className="p-3 rounded-md bg-blue-900/10 border border-blue-500/20 flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-sm text-white">{sim.name}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                                                    {sim.installments}x de {(sim.totalAmount / sim.installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat?.color || '#fff' }} />
                                                    <span className="text-[9px] font-bold uppercase text-zinc-500">{cat?.name}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveSimulation(sim.id)} className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Remover
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Right: Global Chart */}
                <Card className="xl:col-span-2 shadow-2xl border-zinc-800/50 bg-zinc-950/80 h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-500" /> Evolução Global vs Top Categorias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 flex items-end gap-2 md:gap-6 pt-4">
                            {globalChartData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 relative">
                                    <div className="w-full relative group">
                                        {/* Tooltip */}
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap z-20 shadow-xl pointer-events-none">
                                            <span className="text-emerald-400">{d.label}:</span> {d.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
                                        </div>

                                        <div
                                            className="w-full bg-gradient-to-t from-emerald-900/40 to-emerald-500/80 rounded-t-sm transition-all duration-700 bg-[length:100%_200%] hover:bg-[position:0_100%] border-t border-emerald-400/50"
                                            style={{ height: `${Math.max((d.total / maxGlobalTotal) * 100, 2)}px` }}
                                        >
                                            {/* We could render sub-bars (stacked bars) here for Top 3, but a simple bar is cleaner to read globally */}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${d.offset === 0 ? 'text-blue-400' : 'text-zinc-500'}`}>
                                        {d.label} {d.offset === 0 && "(Atual)"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Full Width: Data Table */}
                <Card className="xl:col-span-3 shadow-2xl border-zinc-800/50 bg-zinc-950/80 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase font-black tracking-widest bg-zinc-900/50 text-zinc-400 border-b border-zinc-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 rounded-tl-lg">Categoria</th>
                                    <th scope="col" className="px-6 py-4">Meta Estipulada</th>
                                    {timeLabels.map((l, i) => (
                                        <th key={i} scope="col" className={`px-6 py-4 ${l.offset === 0 ? 'text-blue-400 bg-blue-950/20' : ''}`}>
                                            {l.label}
                                        </th>
                                    ))}
                                    <th scope="col" className="px-6 py-4 rounded-tr-lg text-right">Status (Mês Atual)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryData.filter(c => c.monthlyTotals.some((t: number) => t > 0) || c.goalLimit > 0).map(cat => {
                                    const currSpend = cat.monthlyTotals[2]; // offset 0 (Current) is index 2
                                    const healthRatio = cat.goalLimit > 0 ? (currSpend / cat.goalLimit) * 100 : 0;

                                    let statusLabel = "Saudável";
                                    let StatusIcon = CheckCircle2;
                                    let statusColor = "text-emerald-500";

                                    if (healthRatio > 100) {
                                        statusLabel = "Crítico";
                                        StatusIcon = AlertTriangle;
                                        statusColor = "text-rose-500";
                                    } else if (healthRatio > 80) {
                                        statusLabel = "Cautela";
                                        StatusIcon = AlertTriangle;
                                        statusColor = "text-amber-500";
                                    } else if (cat.goalLimit === 0 && currSpend > 0) {
                                        statusLabel = "Sem Meta";
                                        StatusIcon = Target;
                                        statusColor = "text-blue-500";
                                    }

                                    return (
                                        <tr key={cat.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: cat.color || '#fff' }} />
                                                {cat.name}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                                                {cat.goalLimit > 0 ? cat.goalLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                            </td>
                                            {cat.monthlyTotals.map((tot: number, idx: number) => {
                                                const isCurrent = idx === 2;
                                                const ratio = cat.goalLimit > 0 ? (tot / cat.goalLimit) * 100 : 0;
                                                const isOver = ratio > 100;

                                                return (
                                                    <td key={idx} className={`px-6 py-4 font-mono text-xs ${isCurrent ? 'bg-blue-950/10 font-bold text-white' : 'text-zinc-500'} ${isOver ? 'text-rose-400 font-bold' : ''}`}>
                                                        {tot > 0 ? tot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                                        {tot > 0 && cat.goalLimit > 0 && (
                                                            <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden">
                                                                <div className={`h-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(ratio, 100)}%` }} />
                                                            </div>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center justify-end w-full gap-1.5 text-xs font-black uppercase tracking-widest ${statusColor}`}>
                                                    {statusLabel} <StatusIcon className="w-3.5 h-3.5" />
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
