"use client";

import { useState } from "react";
import { deleteAllTransactions } from "@/actions/transaction";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export function ClearTransactionsButton({ count }: { count: number }) {
    const [loading, setLoading] = useState(false);

    const handleClear = async () => {
        setLoading(true);
        try {
            const deleted = await deleteAllTransactions();
            toast.success(`${deleted} transação(ões) excluída(s) com sucesso!`);
        } catch (error: any) {
            toast.error(error?.message || "Erro ao excluir transações.");
        } finally {
            setLoading(false);
        }
    };

    if (count === 0) return null;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-red-800/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 hover:border-red-700 transition-colors"
                    disabled={loading}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {loading ? "Excluindo..." : "Limpar Tudo"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Excluir todas as transações?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                        Esta ação irá excluir permanentemente todas as suas{" "}
                        <span className="font-semibold text-red-400">{count} transação(ões)</span>.{" "}
                        Essa operação <span className="font-semibold text-white">não pode ser desfeita</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="border-zinc-700 hover:bg-zinc-800">
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleClear}
                        className="bg-red-700 hover:bg-red-600 text-white border-0"
                    >
                        Sim, excluir tudo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
