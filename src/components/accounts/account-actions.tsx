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
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white w-56">
                    <AccountModal
                        initialData={account}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer gap-2">
                                <Edit className="h-4 w-4 text-zinc-400" /> Editar Dados Bancários
                            </DropdownMenuItem>
                        }
                    />
                    <DropdownMenuItem disabled className="gap-2 text-zinc-500">
                        <MoreVertical className="h-4 w-4 text-zinc-600" /> Sincronizar Saldo
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="gap-2 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-archive text-zinc-600"><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>
                        Arquivar Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => setDeleteOpen(true)}
                        className="text-red-500 hover:text-red-400 focus:text-red-400 cursor-pointer gap-2"
                    >
                        <Trash className="h-4 w-4" /> Excluir Conta
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
        </div>
    );
}
