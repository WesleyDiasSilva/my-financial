"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createCategory, updateCategory } from "@/actions/category";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import { toast } from "sonner";

export function CategoryModal({ initialData, trigger }: { initialData?: any; trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: initialData ? {
            name: initialData.name,
            type: initialData.type,
            color: initialData.color || "#3b82f6",
            monthlyLimit: initialData.monthlyLimit ? String(Number(initialData.monthlyLimit).toFixed(2)) : "",
            isRequired: initialData.isRequired ?? false,
            isFixed: initialData.isFixed ?? false,
        } : {
            type: "EXPENSE",
            color: "#3b82f6",
            isRequired: false,
            isFixed: false,
        }
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const rawLimit = String(data.monthlyLimit || "");
            let limitVal = null;
            if (rawLimit.trim() !== "") {
                limitVal = parseFloat(rawLimit.replace(/\./g, '').replace(',', '.'));
            }

            const isExpense = data.type === 'EXPENSE';
            const payload = {
                name: data.name,
                type: data.type,
                color: data.color || "#3b82f6",
                monthlyLimit: isExpense ? limitVal : null,
                isRequired: isExpense ? !!data.isRequired : false,
                isFixed: !!data.isFixed,
            };

            if (initialData) {
                await updateCategory(initialData.id, payload);
                toast.success("Categoria atualizada com sucesso!");
            } else {
                await createCategory(payload);
                toast.success("Categoria criada com sucesso!");
                reset();
            }
            setOpen(false);
        } catch (error: any) {
            toast.error(error?.message || "Erro ao salvar categoria.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" /> Nova Categoria
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Modifique os detalhes desta categoria." : "Crie uma nova categoria para organizar seus gastos e receitas."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Categoria</Label>
                        <Input id="name" placeholder="Ex: Alimentação" required className="bg-zinc-900 border-zinc-800" {...register("name")} />
                    </div>

                    {!(initialData?.id?.startsWith("system-invoice-")) && (
                        <>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={watch("type")} onValueChange={(val) => setValue("type", val)} required>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                        <SelectItem value="EXPENSE">💸 Despesa</SelectItem>
                                        <SelectItem value="INCOME">💰 Receita</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Cor da Categoria</Label>
                                <Input id="color" type="color" className="bg-zinc-900 border-zinc-800 h-10 px-2 py-1 w-full" {...register("color")} />
                            </div>

                            <div className="border border-zinc-800 rounded-lg p-4 space-y-4 bg-zinc-900/30">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classificação</p>
                                {watch("type") === "EXPENSE" && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="isRequired" className="text-sm font-medium cursor-pointer">Obrigatório</Label>
                                            <p className="text-[11px] text-muted-foreground">Gasto essencial, não pode ser cortado</p>
                                        </div>
                                        <Switch
                                            id="isRequired"
                                            checked={!!watch("isRequired")}
                                            onCheckedChange={(val) => setValue("isRequired", val)}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="isFixed" className="text-sm font-medium cursor-pointer">Fixo</Label>
                                        <p className="text-[11px] text-muted-foreground">Valor não varia mês a mês</p>
                                    </div>
                                    <Switch
                                        id="isFixed"
                                        checked={!!watch("isFixed")}
                                        onCheckedChange={(val) => setValue("isFixed", val)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {watch("type") === "EXPENSE" && (
                        <div className="space-y-2">
                            <Label htmlFor="monthlyLimit">Meta de Gasto Mensal (R$)</Label>
                            <CurrencyInput
                                id="monthlyLimit"
                                placeholder="0,00 (opcional)"
                                decimalsLimit={2}
                                decimalSeparator=","
                                groupSeparator="."
                                prefix="R$ "
                                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700"
                                value={watch("monthlyLimit")}
                                onValueChange={(value) => setValue("monthlyLimit", value || "")}
                            />
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" className="border-zinc-800" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {loading ? "Salvando..." : (initialData ? "Salvar" : "Criar Categoria")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
