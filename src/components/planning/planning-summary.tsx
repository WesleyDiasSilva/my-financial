"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import { updateMonthlyIncome } from "@/actions/user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlanningSummaryProps {
    plannedIncome: number;
    totalLimits: number;
}

export function PlanningSummary({ plannedIncome, totalLimits }: PlanningSummaryProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempIncome, setTempIncome] = useState(String(plannedIncome));
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const numericValue = parseFloat(tempIncome.replace(/\./g, '').replace(',', '.'));
            await updateMonthlyIncome(numericValue || 0);
            setIsEditing(false);
            toast.success("Renda mensal atualizada!");
        } catch (error) {
            toast.error("Erro ao atualizar renda.");
        } finally {
            setLoading(false);
        }
    };

    const remaining = plannedIncome - totalLimits;
    const usagePercent = plannedIncome > 0 ? Math.min(100, (totalLimits / plannedIncome) * 100) : 0;

    // Health logic
    const isOver = totalLimits > plannedIncome;
    const isTight = usagePercent > 90 && !isOver;

    return (
        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-[2.5rem] overflow-hidden border-2">
            <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left: Income Configuration */}
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[2px] text-zinc-500 mb-2">Configuração do Planejamento</p>
                            <h3 className="text-3xl font-black text-white tracking-tighter">Quanto você recebe em média?</h3>
                        </div>

                        <div className="flex items-center gap-4">
                            {isEditing ? (
                                <div className="flex-1 flex gap-2">
                                    <CurrencyInput
                                        value={tempIncome}
                                        onValueChange={(val) => setTempIncome(val || "0")}
                                        prefix="R$ "
                                        className="flex-1 h-14 bg-zinc-900 border-emerald-500/50 border-2 rounded-2xl px-6 text-2xl font-black text-emerald-400 focus:outline-none"
                                        autoFocus
                                    />
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="h-14 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold"
                                    >
                                        SALVAR
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 group">
                                    <div className="text-5xl font-black text-white tracking-tighter">
                                        {plannedIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsEditing(true)}
                                        className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Pencil className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Health Metrics */}
                    <div className="bg-zinc-900/30 rounded-[2rem] p-8 border border-zinc-800/50 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl",
                                    isOver ? "bg-red-500/20 text-red-400" : isTight ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400"
                                )}>
                                    {isOver ? <AlertTriangle className="h-6 w-6" /> : isTight ? <TrendingUp className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</p>
                                    <p className="font-bold text-white">
                                        {isOver ? "Orçamento Estourado" : isTight ? "Planejamento Apertado" : "Saúde Financeira OK"}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sobra Planejada</p>
                                <p className={cn("text-xl font-black", remaining < 0 ? "text-red-400" : "text-emerald-400")}>
                                    {remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                                <span>Comprometimento da Renda</span>
                                <span>{usagePercent.toFixed(1)}%</span>
                            </div>
                            <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                                        isOver ? "bg-red-500" : isTight ? "bg-orange-500" : "bg-emerald-500"
                                    )}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-500 italic text-center">
                                Total de metas fixadas: {totalLimits.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
