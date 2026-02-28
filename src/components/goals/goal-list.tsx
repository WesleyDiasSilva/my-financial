"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash, Edit, Target, Calendar, ArrowRight, TrendingUp } from "lucide-react";
import { deleteGoal } from "@/actions/goal";
import { GoalModal } from "@/components/modals/goal-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function GoalList({ goals }: { goals: any[] }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!goalToDelete) return;
        setLoading(true);
        try {
            await deleteGoal(goalToDelete.id);
            toast.success("Meta excluída com sucesso.");
            setDeleteOpen(false);
        } catch (error) {
            toast.error("Erro ao excluir meta.");
        } finally {
            setLoading(false);
        }
    };

    if (goals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-[3rem] bg-zinc-900/10">
                <Target className="h-16 w-16 text-zinc-800 mb-6" />
                <p className="text-zinc-500 font-black text-2xl tracking-tight">Você ainda não definiu nenhuma meta.</p>
                <p className="text-zinc-600 text-base mt-2">Comece criando um objetivo financeiro para acompanhar seu sonho!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {goals.map((goal) => {
                const progress = Math.min(100, Math.floor((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100));
                const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);

                return (
                    <div key={goal.id} className="group relative bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 hover:border-zinc-700 transition-all duration-300 shadow-2xl overflow-hidden">
                        {/* Status Line */}
                        <div className="absolute top-0 left-0 h-2 w-full opacity-60" style={{ backgroundColor: goal.color }} />

                        <div className="flex items-start justify-between mb-8">
                            <div className="p-4 rounded-3xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 shadow-inner" style={{ color: goal.color }}>
                                <Target className="h-8 w-8" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GoalModal initialData={goal} trigger={
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-white bg-zinc-900/50 rounded-full">
                                        <Edit className="h-5 w-5" />
                                    </Button>
                                } />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-zinc-400 hover:text-red-400 bg-zinc-900/50 rounded-full"
                                    onClick={() => { setGoalToDelete(goal); setDeleteOpen(true); }}
                                >
                                    <Trash className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tighter leading-tight">{goal.name}</h3>
                                {goal.deadline && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 font-black uppercase tracking-[0.2em] opacity-70">
                                        <Calendar className="h-4 w-4" />
                                        Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-end justify-between">
                                    <span className="text-zinc-600 font-black uppercase text-[10px] tracking-[0.25em]">Evolução</span>
                                    <span className="text-white font-black text-4xl tracking-tighter italic">{progress}%</span>
                                </div>
                                <div className="h-5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-1">
                                    <div
                                        className="h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                        style={{ width: `${progress}%`, backgroundColor: goal.color }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-zinc-900/80">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Acumulado</span>
                                    <span className="text-white font-black text-2xl tracking-tight">{Number(goal.currentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Objetivo</span>
                                    <span className="text-zinc-600 font-black text-2xl tracking-tight">{Number(goal.targetAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            </div>

                            {remaining > 0 && (
                                <div className="mt-6 pt-6 border-t border-zinc-900 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-zinc-500 font-black text-sm">
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                        Faltam: <span className="text-emerald-400 tracking-tight font-black">{remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    {goal.deadline && (
                                        <div className="text-zinc-300 font-black uppercase tracking-tighter bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full text-[10px]">
                                            {Math.ceil(remaining / Math.max(1, (new Date(goal.deadline).getMonth() - new Date().getMonth() + (12 * (new Date(goal.deadline).getFullYear() - new Date().getFullYear())))))}/mês
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800 rounded-[2rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black tracking-tight">Deseja excluir esta meta?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 text-lg font-medium">
                            Isso removerá todo o histórico visual desta meta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel className="bg-zinc-900 border-zinc-800 font-black text-xs tracking-widest uppercase rounded-xl h-12">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 font-black text-xs tracking-widest uppercase rounded-xl h-12" disabled={loading}>
                            {loading ? "Excluindo..." : "Excluir Meta"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
