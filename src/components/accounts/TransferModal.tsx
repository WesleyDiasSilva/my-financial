"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Wallet, X, Loader2, CalendarIcon, Check } from "lucide-react";
import Cleave from "cleave.js/react";

interface Account {
    id: string;
    name: string;
    balance: number;
    type: string;
    color: string | null;
}

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAccountId: string;
    accounts: Account[];
}

export function TransferModal({ isOpen, onClose, currentAccountId, accounts }: TransferModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [destinationId, setDestinationId] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [isPaid, setIsPaid] = useState(true);
    const [error, setError] = useState("");

    const sourceAccount = accounts.find((a) => a.id === currentAccountId);
    const destinationAccount = accounts.find((a) => a.id === destinationId);
    const otherAccounts = accounts.filter((a) => a.id !== currentAccountId);

    if (!isOpen || !sourceAccount) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const numericAmount = parseFloat(amount.replace(/[^\d,]/g, "").replace(",", "."));

        if (!numericAmount || numericAmount <= 0) {
            setError("Informe um valor válido.");
            return;
        }

        if (!destinationId) {
            setError("Selecione a conta de destino.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceAccountId: currentAccountId,
                    destinationAccountId: destinationId,
                    amount: numericAmount,
                    date,
                    isPaid,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Erro ao realizar a transferência.");
            }

            router.refresh();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto py-8">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-[10000] w-full max-w-xl bg-[#0c1a1f] border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/5 p-8 mx-4 my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white">Transferência entre Contas</h2>
                    <p className="text-xs text-cyan-500/70 uppercase tracking-widest font-semibold mt-1">Fluxo Interno de Capital</p>
                </div>

                {/* Accounts Row */}
                <div className="flex items-start gap-4 mb-8">
                    {/* Origin */}
                    <div className="flex-1">
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                            <Wallet className="w-4 h-4 text-cyan-400" />
                            Origem (De)
                        </label>
                        <div className="bg-[#0a1114] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white cursor-not-allowed opacity-80">
                            {sourceAccount.name}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1.5">
                            Saldo disponível: <span className="text-cyan-400 font-semibold">{formatCurrency(sourceAccount.balance)}</span>
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className="mt-9 bg-cyan-500/10 rounded-full p-2 shrink-0">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                    </div>

                    {/* Destination */}
                    <div className="flex-1">
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                            <Wallet className="w-4 h-4 text-cyan-400" />
                            Destino (Para)
                        </label>
                        <select
                            value={destinationId}
                            onChange={(e) => setDestinationId(e.target.value)}
                            className="w-full bg-[#0a1114] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                        >
                            <option value="">Selecione a conta de destino</option>
                            {otherAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                        {destinationAccount && (
                            <p className="text-xs text-zinc-500 mt-1.5">
                                Saldo atual: <span className="text-cyan-400 font-semibold">{formatCurrency(destinationAccount.balance)}</span>
                            </p>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Value + Date Row */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-sm font-medium text-zinc-400 mb-2 block">Valor da Transferência</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">R$</span>
                                <Cleave
                                    options={{
                                        numeral: true,
                                        numeralDecimalMark: ",",
                                        delimiter: ".",
                                        numeralDecimalScale: 2,
                                    }}
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-[#0a1114] border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-400 mb-2 block">Data da Transferência</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-[#0a1114] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* isPaid Toggle */}
                    <div className="flex items-center justify-between bg-[#0a1114] border border-zinc-800 rounded-xl px-4 py-3 mb-6">
                        <div>
                            <p className="text-sm font-medium text-white">Situação</p>
                            <p className="text-xs text-zinc-500">A transferência já ocorreu?</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPaid(!isPaid)}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${isPaid ? "bg-cyan-500" : "bg-zinc-700"}`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${isPaid ? "translate-x-8" : "translate-x-1"}`}
                            />
                        </button>
                        <span className={`text-sm font-semibold ml-3 ${isPaid ? "text-cyan-400" : "text-zinc-500"}`}>
                            {isPaid ? "Efetivada" : "Pendente"}
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 text-center py-3 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] bg-cyan-500 hover:bg-cyan-600 text-[#0a1114] font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Confirmar Transferência
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer note */}
                <p className="text-[11px] text-zinc-600 text-center mt-6">
                    O saldo das contas é atualizado automaticamente após a confirmação.
                </p>
            </div>
        </div>,
        document.body
    );
}
