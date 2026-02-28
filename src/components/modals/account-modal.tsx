"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createAccount, updateAccount } from "@/actions/account";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";

export function AccountModal({ initialData, trigger }: { initialData?: any, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: initialData ? {
            name: initialData.name,
            balance: initialData.balance != null ? String(Number(initialData.balance)) : "0",
            investmentBalance: initialData.investmentBalance != null ? String(Number(initialData.investmentBalance)) : "0",
            type: initialData.type,
            color: initialData.color || "#6366f1",
        } : {
            type: 'CHECKING',
            balance: "",
            investmentBalance: "",
            color: "#6366f1",
        }
    });

    // Converte string no formato pt-BR (ex: "7.200,50") ou inglês (ex: "7200.5") para número
    const parseCurrency = (val: string | undefined): number => {
        if (!val) return 0;
        // Se tiver vírgula, trata como separador decimal pt-BR: remove pontos (milhar) e troca vírgula por ponto
        if (val.includes(',')) {
            return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
        }
        // Caso contrário, já é um número em formato inglês (ex: "7200" ou "7200.5")
        return parseFloat(val) || 0;
    };

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const payload = {
                name: data.name,
                balance: parseCurrency(data.balance),
                investmentBalance: parseCurrency(data.investmentBalance),
                type: data.type,
                color: data.color || "#6366f1",
            };

            if (initialData) {
                await updateAccount(initialData.id, payload);
                toast.success("Conta atualizada com sucesso!");
            } else {
                await createAccount(payload);
                toast.success("Conta criada com sucesso!");
                reset();
            }
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar conta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" /> Nova Conta
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Conta" : "Nova Conta"}</DialogTitle>
                    <DialogDescription>
                        Cadastre suas contas bancárias ou carteiras de investimentos.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Conta / Banco</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Itaú, Nubank, Corretora"
                            required
                            className="bg-zinc-900 border-zinc-800"
                            {...register("name")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Conta</Label>
                            <Select value={watch("type")} onValueChange={(val) => setValue("type", val)} required>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                    <SelectItem value="CHECKING">Corrente</SelectItem>
                                    <SelectItem value="SAVINGS">Poupança</SelectItem>
                                    <SelectItem value="INVESTMENT">Investimentos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Cor da Conta</Label>
                            <Input
                                id="color"
                                type="color"
                                className="bg-zinc-900 border-zinc-800 h-10 px-2 py-1 w-full cursor-pointer"
                                {...register("color")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="balance">Saldo Disponível (R$)</Label>
                        <CurrencyInput
                            id="balance"
                            placeholder="0,00"
                            decimalsLimit={2}
                            decimalSeparator=","
                            groupSeparator="."
                            prefix="R$ "
                            className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700"
                            value={watch("balance")}
                            onValueChange={(value) => setValue("balance", value || "")}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">Valor disponível para uso no dia a dia.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="investmentBalance">Saldo em Investimentos (R$)</Label>
                        <CurrencyInput
                            id="investmentBalance"
                            placeholder="0,00"
                            decimalsLimit={2}
                            decimalSeparator=","
                            groupSeparator="."
                            prefix="R$ "
                            className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700"
                            value={watch("investmentBalance")}
                            onValueChange={(value) => setValue("investmentBalance", value || "")}
                        />
                        <p className="text-[10px] text-muted-foreground">Valor aplicado em investimentos.</p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" className="border-zinc-800" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading ? "Salvando..." : (initialData ? "Salvar" : "Criar")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
