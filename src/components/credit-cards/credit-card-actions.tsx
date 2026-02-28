"use client";

import { useState } from "react";
import { deleteCreditCard } from "@/actions/credit-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { CreditCardModal } from "@/components/modals/credit-card-modal";
import { useQueryClient } from "@tanstack/react-query";

export function CreditCardActions({ creditCard, accounts }: { creditCard: any; accounts: any[] }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await deleteCreditCard(creditCard.id);
            queryClient.invalidateQueries();
            setDeleteOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir o cartão.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                    <CreditCardModal
                        initialData={creditCard}
                        accounts={accounts}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4 text-zinc-400" /> Editar
                            </DropdownMenuItem>
                        }
                    />
                    <DropdownMenuItem className="text-red-500 hover:text-red-400 focus:text-red-400 cursor-pointer" onSelect={(e) => { e.preventDefault(); setDeleteOpen(true); }}>
                        <Trash className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Cartão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o cartão <strong>{creditCard.name}</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-800 bg-transparent text-white hover:bg-zinc-900 hover:text-white">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                            {loading ? "Excluindo..." : "Sim, Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
