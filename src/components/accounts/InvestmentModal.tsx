"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Loader2, Check, Wallet, TrendingUp, ArrowDown, ArrowUp, Info } from "lucide-react";
import Cleave from "cleave.js/react";

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountId: string;
    accountName: string;
    balance: number;
    investmentBalance: number;
    goals?: { id: string; name: string }[];
}

export function InvestmentModal({ isOpen, onClose, accountId, accountName, balance, investmentBalance, goals }: InvestmentModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [operation, setOperation] = useState<"apply" | "withdraw">("apply");
    const [amount, setAmount] = useState("");
    const [selectedGoalId, setSelectedGoalId] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const numericAmount = parseFloat(amount.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

    // Preview calculations
    const previewBalance = operation === "apply"
        ? balance - numericAmount
        : balance + numericAmount;
    const previewInvestment = operation === "apply"
        ? investmentBalance + numericAmount
        : investmentBalance - numericAmount;

    const isOverLimit = operation === "apply"
        ? numericAmount > balance
        : numericAmount > investmentBalance;

    const formatCurrency = (value: number) =>
        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!numericAmount || numericAmount <= 0) {
            setError("Informe um valor válido.");
            return;
        }

        if (isOverLimit) {
            setError(operation === "apply"
                ? "Saldo disponível insuficiente."
                : "Saldo investido insuficiente.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/investment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId, amount: numericAmount, operation, goalId: operation === "apply" ? selectedGoalId : undefined }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Erro ao processar movimentação.");
            }

            router.refresh();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto py-8">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-[10000] w-full max-w-md bg-[#0c1a1f] border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/5 p-8 mx-4 my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button onClick={onClose} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white">Gestão de Investimentos</h2>
                    <p className="text-xs text-cyan-500/70 uppercase tracking-widest font-semibold mt-1">Fluxo interno de capital</p>
                </div>

                {/* Operation Toggle */}
                <div className="flex bg-[#0a1114] rounded-xl p-1 border border-zinc-800 mb-6">
                    <button
                        type="button"
                        onClick={() => { setOperation("apply"); setAmount(""); setError(""); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${operation === "apply"
                            ? "bg-cyan-500 text-[#0a1114] shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        Aplicar
                    </button>
                    <button
                        type="button"
                        onClick={() => { setOperation("withdraw"); setAmount(""); setError(""); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${operation === "withdraw"
                            ? "bg-cyan-500 text-[#0a1114] shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        Resgatar
                    </button>
                </div>

                {/* Balance Preview Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Saldo Disponível */}
                    <div className={`bg-[#0a1114] border rounded-xl p-4 transition-colors ${numericAmount > 0 && operation === "apply" ? "border-red-500/30" :
                        numericAmount > 0 && operation === "withdraw" ? "border-emerald-500/30" : "border-zinc-800"
                        }`}>
                        <div className="flex items-center gap-1.5 mb-2">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Saldo Disponível</p>
                            {numericAmount > 0 && (
                                operation === "apply"
                                    ? <ArrowDown className="w-3 h-3 text-red-400" />
                                    : <ArrowUp className="w-3 h-3 text-emerald-400" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span className={`text-sm font-bold transition-colors ${numericAmount > 0
                                ? (previewBalance < 0 ? "text-red-400" : operation === "apply" ? "text-orange-300" : "text-emerald-400")
                                : "text-white"
                                }`}>
                                {formatCurrency(numericAmount > 0 ? previewBalance : balance)}
                            </span>
                        </div>
                    </div>

                    {/* Valor Investido */}
                    <div className={`bg-[#0a1114] border rounded-xl p-4 transition-colors ${numericAmount > 0 && operation === "apply" ? "border-emerald-500/30" :
                        numericAmount > 0 && operation === "withdraw" ? "border-red-500/30" : "border-zinc-800"
                        }`}>
                        <div className="flex items-center gap-1.5 mb-2">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Valor Investido</p>
                            {numericAmount > 0 && (
                                operation === "apply"
                                    ? <ArrowUp className="w-3 h-3 text-emerald-400" />
                                    : <ArrowDown className="w-3 h-3 text-red-400" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
                            <span className={`text-sm font-bold transition-colors ${numericAmount > 0
                                ? (previewInvestment < 0 ? "text-red-400" : operation === "withdraw" ? "text-orange-300" : "text-emerald-400")
                                : "text-white"
                                }`}>
                                {formatCurrency(numericAmount > 0 ? previewInvestment : investmentBalance)}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Amount */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-zinc-400 mb-2 block">Valor da Movimentação</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-lg">R$</span>
                            <Cleave
                                options={{
                                    numeral: true,
                                    numeralDecimalMark: ",",
                                    delimiter: ".",
                                    numeralDecimalScale: 2,
                                }}
                                placeholder="0,00"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                                className={`w-full bg-[#0a1114] border rounded-xl pl-14 pr-4 py-4 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors ${isOverLimit && numericAmount > 0 ? "border-red-500/50" : "border-zinc-800"
                                    }`}
                                required
                            />
                        </div>
                        {isOverLimit && numericAmount > 0 && (
                            <p className="text-xs text-red-400 mt-2">
                                {operation === "apply"
                                    ? `Máximo disponível: ${formatCurrency(balance)}`
                                    : `Máximo para resgate: ${formatCurrency(investmentBalance)}`
                                }
                            </p>
                        )}
                    </div>

                    {/* Goal Selection (only for apply) */}
                    {operation === "apply" && goals && goals.length > 0 && (
                        <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-sm font-medium text-zinc-400 mb-2 block">Vincular a uma Meta (Opcional)</label>
                            <select
                                value={selectedGoalId}
                                onChange={(e) => setSelectedGoalId(e.target.value)}
                                className="w-full bg-[#0a1114] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-[#0c1a1f]">Nenhuma (Apenas Investimento)</option>
                                {goals.map(goal => (
                                    <option key={goal.id} value={goal.id} className="bg-[#0c1a1f]">
                                        {goal.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Info Note */}
                    <div className="flex items-start gap-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3 mb-6">
                        <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-400">
                            Esta movimentação não afeta seus relatórios de despesas/receitas, apenas o saldo interno da conta.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <button
                        type="submit"
                        disabled={loading || (isOverLimit && numericAmount > 0)}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-[#0a1114] font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Confirmar Movimentação
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full text-center py-2 text-sm font-medium text-zinc-500 hover:text-white transition-colors"
                    >
                        Cancelar operação
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
}
