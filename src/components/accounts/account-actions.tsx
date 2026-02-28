"use client";

import { useState } from "react";
import { deleteAccount } from "@/actions/account";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MoreVertical, Edit, Trash } from "lucide-react";
import { AccountModal } from "@/components/modals/account-modal";

export function AccountActions({ account }: { account: any }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteAccount(account.id);
            setDeleteOpen(false);
            toast.success("Conta excluída com sucesso!");
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir a conta.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white">
                    <AccountModal
                        initialData={account}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4 text-zinc-400" /> Editar
                            </DropdownMenuItem>
                        }
                    />
                    <DropdownMenuItem
                        onSelect={() => setDeleteOpen(true)}
                        className="text-red-500 hover:text-red-400 focus:text-red-400 cursor-pointer"
                    >
                        <Trash className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente a conta
                            "{account.name}" e todos os dados associados a ela.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-900 border-zinc-800">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={loading}
                        >
                            {loading ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
