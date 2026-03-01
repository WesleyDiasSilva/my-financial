"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createCreditCard, updateCreditCard } from "@/actions/credit-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import CurrencyInput from "react-currency-input-field";

import { useQueryClient } from "@tanstack/react-query";

export function CreditCardModal({ accounts, initialData, trigger }: { accounts: any[]; initialData?: any; trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: initialData ? {
            name: initialData.name,
            limit: initialData.limit ? String(Number(initialData.limit).toFixed(2)) : "",
            closingDay: initialData.closingDay,
            dueDay: initialData.dueDay,
            color: initialData.color || "#8b5cf6",
            goal: initialData.goal ? String(Number(initialData.goal).toFixed(2)) : "",
            accountId: initialData.accountId || "",
        } : {
            color: "#8b5cf6",
            accountId: "",
            limit: "",
            goal: "",
        }
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            if (!data.accountId) {
                toast.error("Por favor, selecione uma conta vinculada ao cartão.");
                setLoading(false);
                return;
            }

            const numericLimit = parseFloat(String(data.limit || "0"));

            const numericGoal = data.goal && String(data.goal).trim() !== ""
                ? parseFloat(String(data.goal))
                : null;

            const payload = {
                name: data.name,
                limit: numericLimit,
                closingDay: parseInt(data.closingDay),
                dueDay: parseInt(data.dueDay),
                color: data.color || "#8b5cf6",
                goal: numericGoal || undefined,
                accountId: data.accountId
            };

            if (initialData) {
                await updateCreditCard(initialData.id, payload);
                toast.success("Cartão atualizado com sucesso!");
            } else {
                await createCreditCard(payload);
                toast.success("Cartão criado com sucesso!");
                reset();
            }
            queryClient.invalidateQueries();
            setOpen(false);
        } catch (error: any) {
            toast.error(error?.message || "Erro ao salvar cartão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" /> Novo Cartão
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Cartão" : "Adicionar Cartão"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Modifique os detalhes deste cartão de crédito." : "Gerencie um novo cartão de crédito para acompanhar faturas."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome / Apelido do Cartão</Label>
                        <Input id="name" placeholder="Ex: Nubank Platinum" required className="bg-zinc-900 border-zinc-800" {...register("name")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="limit">Limite Total (R$)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                                <CurrencyInput
                                    id="limit"
                                    placeholder="0,00"
                                    decimalsLimit={2}
                                    decimalSeparator=","
                                    groupSeparator="."
                                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 placeholder:text-muted-foreground"
                                    value={watch("limit")}
                                    onValueChange={(value) => setValue("limit", value || "")}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="goal" className="flex items-center gap-1">Meta Máxima (Opcional)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                            <CurrencyInput
                                id="goal"
                                placeholder="0,00"
                                decimalsLimit={2}
                                decimalSeparator=","
                                groupSeparator="."
                                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 placeholder:text-muted-foreground"
                                value={watch("goal")}
                                onValueChange={(value) => setValue("goal", value || "")}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="closingDay">Dia Fechamento</Label>
                            <Input id="closingDay" type="number" min="1" max="31" required className="bg-zinc-900 border-zinc-800" {...register("closingDay")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDay">Dia Vencimento</Label>
                            <Input id="dueDay" type="number" min="1" max="31" required className="bg-zinc-900 border-zinc-800" {...register("dueDay")} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="color">Cor Principal do Cartão</Label>
                        <Input id="color" type="color" className="bg-zinc-900 border-zinc-800 h-10 px-2 py-1 w-full" {...register("color")} />
                    </div>
                    <div className="space-y-2">
                        <Label>Conta para Pagamento da Fatura</Label>
                        <Select value={watch("accountId")} onValueChange={(val) => setValue("accountId", val)} required>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                <SelectValue placeholder="Selecione a conta corrente" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">De onde sairá o dinheiro para pagar este cartão.</p>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" className="border-zinc-800" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading ? "Salvando..." : (initialData ? "Salvar" : "Salvar Cartão")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
