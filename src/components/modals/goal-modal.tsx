"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createGoal, updateGoal } from "@/actions/goal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Target, Calendar, Info, Palette, Sparkles, Loader2 } from "lucide-react";
import CurrencyInput from 'react-currency-input-field';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateSuggestedMilestones } from "@/actions/ai-goals";

export function GoalModal({ initialData, trigger }: { initialData?: any, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [milestones, setMilestones] = useState<{ description: string, amount: string }[]>(
        initialData?.milestones?.map((m: any) => ({
            description: m.description,
            amount: Number(m.amount).toString()
        })) || []
    );

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: initialData ? {
            name: initialData.name,
            targetAmount: Math.abs(Number(initialData.targetAmount)).toString(),
            currentAmount: Math.abs(Number(initialData.currentAmount)).toString(),
            deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : "",
            color: initialData.color || "#10b981",
        } : {
            targetAmount: "",
            currentAmount: "0",
            color: "#10b981",
        }
    });

    const [loading, setLoading] = useState(false);

    const handleAiGenerate = async () => {
        const targetAmount = watch("targetAmount");
        if (!targetAmount || targetAmount === "0") {
            toast.error("Informe o valor alvo primeiro!");
            return;
        }

        setIsAiGenerating(true);
        try {
            const amount = parseFloat(targetAmount.replace(/,/g, '.'));
            const suggested = await generateSuggestedMilestones(amount);

            if (suggested && suggested.length > 0) {
                setMilestones(suggested.map(m => ({
                    description: m.description,
                    amount: m.amount.toString()
                })));
                toast.success("Marcos sugeridos com sucesso!");
            } else {
                toast.error("Não foi possível gerar sugestões agora.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro na geração de IA");
        } finally {
            setIsAiGenerating(false);
        }
    };

    const addMilestone = () => {
        setMilestones([...milestones, { description: "", amount: "" }]);
    };

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const updateMilestone = (index: number, field: 'description' | 'amount', value: string) => {
        const newMilestones = [...milestones];
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    };

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const payload = {
                name: data.name,
                targetAmount: parseFloat(data.targetAmount.replace(/,/g, '.')),
                currentAmount: parseFloat(data.currentAmount.replace(/,/g, '.')),
                deadline: data.deadline ? new Date(data.deadline) : null,
                color: data.color,
                milestones: milestones.map(m => ({
                    description: m.description,
                    amount: parseFloat(m.amount.replace(/,/g, '.'))
                }))
            };

            if (initialData) {
                await updateGoal(initialData.id, payload);
                toast.success("Meta atualizada!");
            } else {
                await createGoal(payload);
                toast.success("Meta criada com sucesso!");
                reset();
                setMilestones([]);
            }
            setOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao salvar meta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-emerald-600 hover:bg-emerald-500 font-black text-xs tracking-[0.2em] uppercase h-14 px-8 rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all">
                        <Plus className="mr-2 h-5 w-5" /> Nova Meta
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-zinc-800 p-0 overflow-hidden shadow-2xl rounded-[2.5rem] flex flex-col max-h-[90vh]">
                <div className="h-2 w-full bg-emerald-500 shrink-0" style={{ backgroundColor: watch("color") }} />

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-4xl font-black tracking-tighter text-white">
                                {initialData ? "Editar Meta" : "Novo Objetivo"}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500 text-lg font-medium">
                                Defina seus alvos financeiros e visualize seu progresso rumo à liberdade.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-zinc-500 text-xs font-black uppercase tracking-[0.25em] ml-1">Identificação</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Viagem, Carro, Reserva de Emergência..."
                                    {...register("name")}
                                    className="bg-zinc-900 border-zinc-800 h-16 text-xl font-bold placeholder:text-zinc-700 focus:ring-emerald-500/20 rounded-2xl"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="targetAmount" className="text-zinc-500 text-xs font-black uppercase tracking-[0.25em] ml-1">Valor Alvo</Label>
                                    <CurrencyInput
                                        id="targetAmount"
                                        placeholder="R$ 0,00"
                                        decimalsLimit={2}
                                        decimalSeparator=","
                                        groupSeparator="."
                                        prefix="R$ "
                                        className="flex h-16 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-2 text-2xl font-black text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        value={watch("targetAmount")}
                                        onValueChange={(value) => setValue("targetAmount", value || "")}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="currentAmount" className="text-zinc-500 text-xs font-black uppercase tracking-[0.25em] ml-1">Já Guardado</Label>
                                    <CurrencyInput
                                        id="currentAmount"
                                        placeholder="R$ 0,00"
                                        decimalsLimit={2}
                                        decimalSeparator=","
                                        groupSeparator="."
                                        prefix="R$ "
                                        className="flex h-16 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-2 text-2xl font-black text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        value={watch("currentAmount")}
                                        onValueChange={(value) => setValue("currentAmount", value || "")}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="deadline" className="text-zinc-500 text-xs font-black uppercase tracking-[0.25em] ml-1">Prazo Final</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-600 pointer-events-none" />
                                        <Input
                                            id="deadline"
                                            type="date"
                                            {...register("deadline")}
                                            className="bg-zinc-900 border-zinc-800 h-16 pl-14 text-xl font-bold text-zinc-100 rounded-2xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="color" className="text-zinc-500 text-xs font-black uppercase tracking-[0.25em] ml-1">Cor Temática</Label>
                                    <div className="relative flex items-center">
                                        <Palette className="absolute left-4 h-6 w-6 text-zinc-600 pointer-events-none shadow-sm" />
                                        <Input
                                            id="color"
                                            type="color"
                                            {...register("color")}
                                            className="h-16 w-full bg-zinc-900 border-zinc-800 pl-14 pr-3 py-3 cursor-pointer transition-all hover:border-zinc-700 rounded-2xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Milestones Section */}
                            <div className="space-y-4 pt-4 border-t border-zinc-900">
                                <div className="flex items-center justify-between">
                                    <Label className="text-zinc-500 text-xs font-black uppercase tracking-[0.25em]">Marcos da Jornada (Milestones)</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAiGenerate}
                                            disabled={isAiGenerating}
                                            className="bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-xl"
                                        >
                                            {isAiGenerating ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Sparkles className="h-4 w-4 mr-2" />
                                            )}
                                            Sugerir com IA
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addMilestone}
                                            className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white rounded-xl"
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Adicionar
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {milestones.map((m, idx) => (
                                        <div key={idx} className="flex gap-4 items-end animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    placeholder="Descrição do marco (ex: 50% concluído)"
                                                    value={m.description}
                                                    onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                                                    className="bg-zinc-900 border-zinc-800 h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="w-40 space-y-2">
                                                <CurrencyInput
                                                    placeholder="Valor"
                                                    decimalsLimit={2}
                                                    decimalSeparator=","
                                                    groupSeparator="."
                                                    prefix="R$ "
                                                    value={m.amount}
                                                    onValueChange={(val) => updateMilestone(idx, 'amount', val || "")}
                                                    className="flex h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 focus:outline-none"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeMilestone(idx)}
                                                className="h-12 w-12 text-zinc-600 hover:text-red-400"
                                            >
                                                <Plus className="h-5 w-5 rotate-45" />
                                            </Button>
                                        </div>
                                    ))}
                                    {milestones.length === 0 && (
                                        <p className="text-zinc-600 text-xs italic">Nenhum marco configurado. Adicione marcos para celebrar pequenas vitórias!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-10 pt-0 shrink-0 gap-4">
                        <Button type="button" variant="ghost" className="text-zinc-600 font-black uppercase text-xs tracking-widest h-14" onClick={() => setOpen(false)}>
                            VOLTAR
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-14 font-black text-sm tracking-[0.25em] uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl rounded-2xl"
                        >
                            {loading ? "PROCESSANDO..." : (initialData ? "SALVAR ALTERAÇÕES" : "CRIAR OBJETIVO")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
