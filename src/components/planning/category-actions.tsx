"use client";

import { useState } from "react";
import { deleteCategory } from "@/actions/category";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MoreVertical, Edit, Trash } from "lucide-react";
import { CategoryModal } from "@/components/modals/category-modal";

export function CategoryActions({ category }: { category: any }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await deleteCategory(category.id);
            setDeleteOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir a categoria.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                    <CategoryModal
                        initialData={category}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4 text-zinc-400" /> Editar
                            </DropdownMenuItem>
                        }
                    />
                    {!category.id.startsWith("system-invoice-") && (
                        <DropdownMenuItem className="text-red-500 hover:text-red-400 focus:text-red-400 cursor-pointer" onSelect={(e) => { e.preventDefault(); setDeleteOpen(true); }}>
                            <Trash className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a categoria <strong>{category.name}</strong>? Esta ação não pode ser desfeita.
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
