"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, CreditCard as CardIcon, Calendar, Info, Repeat, CheckCircle2, Loader2 } from "lucide-react";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export function TransactionModal({
    categories,
    creditCards,
    accounts,
    initialData,
    trigger,
    isCreditCardOnly = false,
    fixedCreditCardId
}: {
    categories: any[],
    creditCards: any[],
    accounts: any[],
    initialData?: any,
    trigger?: React.ReactNode,
    isCreditCardOnly?: boolean,
    fixedCreditCardId?: string
}) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData ? {
            type: initialData.type,
            description: initialData.description,
            amount: Math.abs(Number(initialData.amount)).toString(),
            date: new Date(initialData.date).toISOString().split('T')[0],
            paymentMethod: initialData.creditCardId ? 'CREDIT_CARD' : 'CASH',
            creditCardId: initialData.creditCardId || fixedCreditCardId || undefined,
            accountId: initialData.accountId || undefined,
            categoryId: initialData.categoryId,
            isPaid: initialData.isPaid ?? true,
            isRecurring: initialData.isRecurring || false,
            recurrenceType: initialData.recurrenceType || 'MONTHLY',
            recurrencePeriod: initialData.recurrencePeriod || 1,
            installments: 1,
            isReimbursable: initialData.isReimbursable ?? false,
            reimbursementDate: initialData.reimbursementDate ? new Date(initialData.reimbursementDate).toISOString().split('T')[0] : '',
        } : {
            type: 'EXPENSE',
            paymentMethod: isCreditCardOnly ? 'CREDIT_CARD' : 'CASH',
            creditCardId: fixedCreditCardId || undefined,
            accountId: isCreditCardOnly && fixedCreditCardId
                ? creditCards.find(c => c.id === fixedCreditCardId)?.accountId
                : undefined,
            date: new Date().toLocaleDateString('en-CA'), // Returns YYYY-MM-DD in local time
            isPaid: isCreditCardOnly ? false : true,
            isRecurring: false,
            recurrenceType: 'MONTHLY',
            recurrencePeriod: 1,
            installments: 1,
            isReimbursable: false,
            reimbursementDate: ''
        }
    });
    useEffect(() => {
        register("categoryId", { required: true });
    }, [register]);

    const [loading, setLoading] = useState(false);

    const type = watch("type");
    const paymentMethod = watch("paymentMethod");
    const isRecurring = watch("isRecurring");
    const isPaid = watch("isPaid");
    const installments = watch("installments");
    const amount = watch("amount");

    // Smart Logic Function
    const applySmartStatus = (dateVal: string, methodVal: string) => {
        if (initialData) return;
        if (!dateVal) return;

        const selectedDate = new Date(dateVal);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(23, 59, 59, 999);

        const isFuture = selectedDate > today;
        const isPast = selectedDate < today;

        if (isFuture) {
            setValue("isPaid", false);
        } else if (isPast && methodVal === 'CREDIT_CARD') {
            setValue("isPaid", true);
        } else if (!isFuture && methodVal === 'CASH') {
            setValue("isPaid", true);
        }
    };

    const handleDateChange = (dateVal: string) => {
        setValue("date", dateVal);
        applySmartStatus(dateVal, paymentMethod);
    };

    const handleMethodChange = (methodVal: string) => {
        setValue("paymentMethod", methodVal);
        applySmartStatus(watch("date"), methodVal);
        if (methodVal === 'CASH') setValue("installments", 1);
    };

    // List filtering
    const filteredCategories = categories.filter(cat => cat.type === type && !cat.id.startsWith("system-invoice-"));

    useEffect(() => {
        // Only clear if not initialData (initial data might have category set correctly)
        // Or if the current categoryId doesn't belong to the new filtered list
        const currentCatId = watch("categoryId");
        if (currentCatId && !filteredCategories.find(c => c.id === currentCatId)) {
            setValue("categoryId", "");
        }
    }, [type, filteredCategories, setValue, watch]);

    const isReimbursable = watch("isReimbursable");
    const reimbursementDate = watch("reimbursementDate");

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const rawAmount = String(data.amount || "0");
            const numericAmount = parseFloat(rawAmount.replace(/,/g, '.'));

            const payload = {
                description: data.description,
                amount: numericAmount,
                type: data.type,
                date: new Date(data.date + 'T12:00:00'),
                categoryId: data.categoryId,
                accountId: data.paymentMethod === 'CASH' ? data.accountId : null,
                creditCardId: data.paymentMethod === 'CREDIT_CARD' ? data.creditCardId : null,
                isPaid: data.paymentMethod === 'CREDIT_CARD' ? false : data.isPaid,
                isRecurring: data.isRecurring,
                recurrenceType: data.isRecurring ? data.recurrenceType : null,
                recurrencePeriod: data.isRecurring ? Number(data.recurrencePeriod) : null,
                installments: Number(data.installments),

                // Extra fields mapped for Actions
                isReimbursable: data.isReimbursable ?? false,
                reimbursementDate: data.isReimbursable && data.reimbursementDate ? new Date(data.reimbursementDate + 'T12:00:00') : null,
            };

            if (initialData) {
                await updateTransaction(initialData.id, payload);
                toast.success("Lançamento atualizado!");
            } else {
                await createTransaction(payload);
                toast.success("Lançamento realizado com sucesso!");
                reset();
            }
            queryClient.invalidateQueries();
            setOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao salvar transação");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-emerald-600 hover:bg-emerald-700 hidden md:flex font-semibold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                        <Plus className="mr-2 h-4 w-4" /> Nova Transação
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-zinc-950 border-zinc-800 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Visual Accent Bar */}
                <div className={cn(
                    "h-1.5 w-full shrink-0 transition-colors duration-500",
                    type === 'INCOME' ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                )} />

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                                {initialData ? "Editar Lançamento" : (isCreditCardOnly ? "Lançar Gasto no Cartão" : "Novo Lançamento")}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 text-sm">
                                {isCreditCardOnly ? "Informe os detalhes do gasto realizado no cartão." : "Configure os detalhes do seu fluxo financeiro."}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Transaction Type Selector (Custom Tabs) - Hidden if isCreditCardOnly */}
                        {!isCreditCardOnly && (
                            <div className="grid grid-cols-2 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                                <button
                                    type="button"
                                    onClick={() => setValue("type", "EXPENSE")}
                                    className={cn(
                                        "py-2.5 rounded-lg text-sm font-bold transition-all duration-300",
                                        type === 'EXPENSE'
                                            ? "bg-zinc-800 text-red-400 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Gasto / Despesa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue("type", "INCOME")}
                                    className={cn(
                                        "py-2.5 rounded-lg text-sm font-bold transition-all duration-300",
                                        type === 'INCOME'
                                            ? "bg-zinc-800 text-emerald-400 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Ganho / Receita
                                </button>
                            </div>
                        )}

                        {/* Section: O que e Quanto */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-zinc-400 text-[10px] font-black uppercase tracking-[2px]">Descrição</Label>
                                    <Input
                                        id="description"
                                        placeholder="Ex: Supermercado, Aluguel, Job..."
                                        {...register("description")}
                                        className="bg-zinc-900 border-zinc-800 focus:border-zinc-600 h-12 text-base transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount" className="text-zinc-400 text-[10px] font-black uppercase tracking-[2px]">Valor</Label>
                                        <CurrencyInput
                                            id="amount"
                                            name="amount"
                                            placeholder="R$ 0,00"
                                            decimalsLimit={2}
                                            decimalSeparator=","
                                            groupSeparator="."
                                            prefix="R$ "
                                            className="flex h-12 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xl font-mono font-bold text-zinc-100 focus:outline-none focus:border-zinc-600 transition-all"
                                            value={watch("amount")}
                                            onValueChange={(value) => setValue("amount", value || "")}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date" className="text-zinc-400 text-[10px] font-black uppercase tracking-[2px]">Data</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                                            <Input
                                                id="date"
                                                type="date"
                                                {...register("date")}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="bg-zinc-900 border-zinc-800 h-12 pl-10 text-zinc-100 transition-all focus:border-zinc-600 [&::-webkit-calendar-picker-indicator]:opacity-0"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Meio de Pagamento - Hidden if isCreditCardOnly */}
                        {!isCreditCardOnly && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
                                <Label className="text-zinc-400 text-[10px] font-black uppercase tracking-[2px]">Meio de Lançamento</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleMethodChange("CASH")}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all relative overflow-hidden group col-span-2",
                                            paymentMethod === 'CASH'
                                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                                : "bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                        )}
                                    >
                                        <Wallet className={cn("h-6 w-6 transition-transform group-hover:scale-110", paymentMethod === 'CASH' && "text-emerald-400")} />
                                        <span className="text-[11px] font-black tracking-widest uppercase">Dinheiro / Pix</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                    <Info className="h-3 w-3 text-zinc-500" />
                                    <p className="text-[10px] text-zinc-500 italic">Para lançamentos no cartão, vá até a aba de Cartões de Crédito.</p>
                                </div>
                            </div>
                        )}

                        {isCreditCardOnly && (
                            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-center gap-3">
                                <CardIcon className="h-5 w-5 text-blue-400" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Lançamento em Cartão</p>
                                    <p className="text-xs text-zinc-400">Este gasto será adicionado à fatura do {creditCards.find(c => c.id === (watch("creditCardId") || fixedCreditCardId))?.name}.</p>
                                </div>
                            </div>
                        )}

                        {/* Selects: Origem e Categoria */}
                        <div className={cn(
                            "grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000",
                            isCreditCardOnly ? "grid-cols-1" : "grid-cols-2"
                        )}>
                            {!isCreditCardOnly && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase text-zinc-500 font-bold tracking-tighter">Qual {paymentMethod === 'CASH' ? 'Conta' : 'Cartão'}?</Label>
                                    {paymentMethod === 'CASH' ? (
                                        <Select value={watch("accountId")} onValueChange={(val) => setValue("accountId", val)} required>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 rounded-lg">
                                                <SelectValue placeholder="Escolha..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Select
                                            value={watch("creditCardId")}
                                            onValueChange={(val) => setValue("creditCardId", val)}
                                            required
                                            disabled={!!fixedCreditCardId}
                                        >
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 rounded-lg">
                                                <SelectValue placeholder="Escolha..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                {creditCards.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-zinc-500 font-bold tracking-tighter">Categoria</Label>
                                <Select value={watch("categoryId")} onValueChange={(val) => setValue("categoryId", val)} required>
                                    <SelectTrigger className={cn(
                                        "bg-zinc-900 border-zinc-800 h-10 rounded-lg",
                                        errors.categoryId && "border-red-500/50 focus:border-red-500"
                                    )}>
                                        <SelectValue placeholder="Escolha..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                        {filteredCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.categoryId && (
                                    <span className="text-[10px] text-red-500 font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                                        Categoria é obrigatória
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Features: Paid and Recurring and Reimbursable*/}
                        <div className={cn(
                            "grid gap-3 pt-2",
                            type === 'EXPENSE' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
                        )}>
                            {/* Paid Switch - Hidden if isCreditCardOnly */}
                            {!isCreditCardOnly ? (
                                <div className={cn(
                                    "group flex items-center justify-between p-3.5 rounded-2xl border transition-all",
                                    isPaid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-orange-500/5 border-orange-500/20"
                                )}>
                                    <div className="flex flex-col">
                                        <Label className="text-[11px] font-black uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">Efetivada?</Label>
                                        <p className="text-[10px] text-zinc-600 truncate mr-2">{isPaid ? 'Confirmada' : 'Pendente'}</p>
                                    </div>
                                    <Switch checked={watch("isPaid")} onCheckedChange={(val) => setValue("isPaid", val)} className="shrink-0" />
                                </div>
                            ) : (
                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-2xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <Label className="text-[11px] font-black uppercase text-emerald-500 transition-colors">Status</Label>
                                        <p className="text-[10px] text-zinc-500 truncate mr-2">Lançado na Fatura</p>
                                    </div>
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                </div>
                            )}

                            <div className={cn(
                                "group flex items-center justify-between p-3.5 rounded-2xl border transition-all",
                                isRecurring ? "bg-blue-500/5 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]" : "bg-zinc-950/50 border-zinc-800"
                            )}>
                                <div className="flex flex-col">
                                    <Label className="text-[11px] font-black uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">Repetir?</Label>
                                    <p className="text-[10px] text-zinc-600 truncate mr-2">{isRecurring ? 'Recorrência ON' : 'Uma vez'}</p>
                                </div>
                                <Switch checked={watch("isRecurring")} onCheckedChange={(val) => setValue("isRecurring", val)} className="shrink-0" />
                            </div>

                            {/* Reimbursable Switch (Only for Expenses) */}
                            {type === 'EXPENSE' && !initialData && (
                                <div className={cn(
                                    "sm:col-span-2 md:col-span-1 group flex items-center justify-between p-3.5 rounded-2xl border transition-all",
                                    isReimbursable ? "bg-yellow-500/5 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]" : "bg-zinc-950/50 border-zinc-800"
                                )}>
                                    <div className="flex flex-col">
                                        <Label className="text-[11px] font-black uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">Reembolso?</Label>
                                        <p className="text-[10px] text-zinc-600 truncate mr-2">{isReimbursable ? 'Receber dnv' : 'Não'}</p>
                                    </div>
                                    <Switch checked={watch("isReimbursable")} onCheckedChange={(val) => setValue("isReimbursable", val)} className="shrink-0" />
                                </div>
                            )}
                        </div>

                        {/* Reimbursement Options */}
                        {isReimbursable && type === 'EXPENSE' && !initialData && (
                            <div className="p-4 bg-yellow-500/5 rounded-2xl border border-dashed border-yellow-500/30 space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-2 text-yellow-500 text-[10px] font-black uppercase tracking-[2px]">
                                    <CheckCircle2 className="h-3 w-3" /> Configuração de Reembolso
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reimbursementDate" className="text-zinc-400 text-[10px] font-black uppercase tracking-[2px]">Data Prevista de Recebimento</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                                        <Input
                                            id="reimbursementDate"
                                            type="date"
                                            {...register("reimbursementDate", { required: isReimbursable })}
                                            className={cn(
                                                "bg-zinc-900 border-zinc-800 h-10 pl-10 text-zinc-100 transition-all focus:border-yellow-500/50 [&::-webkit-calendar-picker-indicator]:opacity-0",
                                                errors.reimbursementDate && "border-red-500/50 focus:border-red-500"
                                            )}
                                        />
                                    </div>
                                    {errors.reimbursementDate && (
                                        <p className="text-[10px] text-red-500 font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-1 mt-1">Data obrigatória para reembolsos</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Recurrence Options Expanded */}
                        {isRecurring && (
                            <div className="p-4 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[2px]">
                                    <Repeat className="h-3 w-3" /> Frequência da Transação
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-zinc-500 font-bold">Ciclo</Label>
                                        <Select value={watch("recurrenceType")} onValueChange={(val) => setValue("recurrenceType", val)}>
                                            <SelectTrigger className="bg-zinc-900/80 border-zinc-800 h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                <SelectItem value="WEEKLY">Semanal</SelectItem>
                                                <SelectItem value="MONTHLY">Mensal</SelectItem>
                                                <SelectItem value="YEARLY">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-zinc-500 font-bold">A cada</Label>
                                        <Select value={String(watch("recurrencePeriod"))} onValueChange={(val) => setValue("recurrencePeriod", parseInt(val))}>
                                            <SelectTrigger className="bg-zinc-900/80 border-zinc-800 h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                {[1, 2, 3, 4, 5, 6, 12].map(num => (
                                                    <SelectItem key={num} value={String(num)}>{num} {watch("recurrenceType") === 'MONTHLY' ? 'mês/es' : watch("recurrenceType") === 'WEEKLY' ? 'sem/as' : 'ano/s'}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section: Parcelamento (Only for Credit Card) */}
                        {(paymentMethod === 'CREDIT_CARD' || isCreditCardOnly) && !initialData && (
                            <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/20 space-y-4 animate-in zoom-in-95 duration-300 shadow-[0_0_20px_rgba(249,115,22,0.02)]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-[2px]">
                                        <Repeat className="h-3 w-3" /> Parcelamento
                                    </div>
                                    {amount && installments > 1 && (
                                        <div className="text-[10px] font-black text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">
                                            {installments}x de {((parseFloat(amount.replace(/,/g, '.')) || 0) / installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-zinc-500 font-bold">Número de Parcelas</Label>
                                        <Select value={String(watch("installments"))} onValueChange={(val) => setValue("installments", parseInt(val))}>
                                            <SelectTrigger className="bg-zinc-900 border-zinc-800 h-11 rounded-xl transition-all hover:border-zinc-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                                                    <SelectItem key={num} value={String(num)} className="font-bold text-xs">{num}x {num === 1 ? '(À vista)' : ''}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 pt-2 bg-zinc-950/80 backdrop-blur-sm border-t border-zinc-900 gap-3 sm:gap-2">
                        <Button type="button" variant="ghost" className="text-zinc-500 hover:text-zinc-300 font-bold text-xs" onClick={() => setOpen(false)}>
                            CANCELAR
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "flex-1 sm:flex-none h-12 px-10 font-black text-xs tracking-[2px] uppercase transition-all transform active:scale-95 shadow-xl",
                                type === 'INCOME'
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10 disabled:bg-emerald-600/50"
                                    : "bg-zinc-100 hover:bg-white text-zinc-950 disabled:bg-zinc-300"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    PROCESSANDO...
                                </>
                            ) : (
                                initialData ? "SALVAR ALTERAÇÕES" : "CONFIRMAR REGISTRO"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
