"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, Filter, Search, MoreHorizontal, Trash, Edit, ArrowUpDown, Clock, CheckCircle2, Repeat } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteTransaction, deleteTransactions, toggleTransactionPaid } from "@/actions/transaction";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TransactionList({ transactions, categories, creditCards, accounts }: { transactions: any[], categories: any[], creditCards: any[], accounts: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");
    const [accountFilter, setAccountFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [txToDelete, setTxToDelete] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const toggleSort = (field: string) => {
        setSortConfig(prevConfig => {
            if (prevConfig && prevConfig.key === field) {
                return { ...prevConfig, direction: prevConfig.direction === "asc" ? "desc" : "asc" };
            }
            return { key: field, direction: "desc" };
        });
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!txToDelete) return;
        setLoading(true);
        try {
            await deleteTransaction(txToDelete.id);
            setDeleteOpen(false);
            setTxToDelete(null);
            setSelectedIds(prev => prev.filter(id => id !== txToDelete.id));
            toast.success("Transação excluída!");
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir transação.");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setLoading(true);
        try {
            await deleteTransactions(selectedIds);
            setSelectedIds([]);
            setBulkDeleteOpen(false);
            toast.success(`${selectedIds.length} transações excluídas!`);
        } catch (error: any) {
            toast.error("Erro ao excluir transações selecionadas.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        const allFilteredIds = filtered.map(tx => tx.id);
        const allSelected = allFilteredIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await toggleTransactionPaid(id);
            toast.success("Status atualizado!");
        } catch (error: any) {
            toast.error("Erro ao atualizar status.");
        }
    };

    const filtered = useMemo(() => {
        let currentTransactions = transactions.filter(tx => {
            // Search by description or value
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = tx.description.toLowerCase().includes(searchLower) || String(tx.amount).includes(searchLower);

            // Type
            const matchType = typeFilter === "all" || (typeFilter === "income" && tx.type === "INCOME") || (typeFilter === "expense" && tx.type === "EXPENSE");

            // Month
            const txMonth = new Date(tx.date).getMonth() + 1; // 1 to 12
            const txYear = new Date(tx.date).getFullYear();
            const txMonthKey = `${txYear}-${txMonth.toString().padStart(2, '0')}`;
            const matchMonth = monthFilter === "all" || monthFilter === txMonthKey;

            // Account Filter (Direct Account OR via Linked Credit Card)
            let matchAcct = true;
            if (accountFilter !== "all") {
                if (tx.accountId) {
                    matchAcct = tx.accountId === accountFilter;
                } else if (tx.creditCardId) {
                    const cardForTx = creditCards.find(c => c.id === tx.creditCardId);
                    matchAcct = cardForTx?.accountId === accountFilter;
                } else {
                    matchAcct = false; // No account and no card, therefore doesn't belong to the selected account
                }
            }

            return matchSearch && matchType && matchMonth && matchAcct;
        });

        if (sortConfig !== null) {
            currentTransactions.sort((a, b) => {
                let valA, valB;
                if (sortConfig.key === "date") { valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); }
                else if (sortConfig.key === "amount") { valA = Math.abs(Number(a.amount)); valB = Math.abs(Number(b.amount)); }
                else if (sortConfig.key === "category") { valA = a.category?.name || ""; valB = b.category?.name || ""; }
                else return 0;

                if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
                if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }
        return currentTransactions;
    }, [transactions, searchTerm, typeFilter, monthFilter, accountFilter, sortConfig, creditCards]);

    const availableMonths = useMemo(() => {
        const unique = new Set<string>();
        transactions.forEach(tx => {
            const d = new Date(tx.date);
            unique.add(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
        });
        return Array.from(unique).sort().reverse();
    }, [transactions]);

    const formatMonth = (str: string) => {
        const [y, m] = str.split('-');
        const date = new Date(parseInt(y), parseInt(m) - 1, 1);
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="relative flex-[1_1_300px] min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por descrição ou valor..."
                        className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 flex-shrink-0">
                        <SelectValue placeholder="Conta" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Contas</SelectItem>
                        {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-800 flex-shrink-0">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="income">Receitas</SelectItem>
                        <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 flex-shrink-0">
                        <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Meses</SelectItem>
                        {availableMonths.map(m => (
                            <SelectItem key={m} value={m} className="capitalize">{formatMonth(m)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedIds.length > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="animate-in fade-in slide-in-from-left-2 duration-300 font-bold text-[10px] tracking-widest px-4 h-9 flex-shrink-0 uppercase"
                        onClick={() => setBulkDeleteOpen(true)}
                    >
                        <Trash className="h-3 w-3 mr-2" /> Excluir ({selectedIds.length})
                    </Button>
                )}
            </div>

            <div className="border border-zinc-800 rounded-md mt-4">
                <Table>
                    <TableHeader className="bg-zinc-900/50">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="w-[40px]">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-zinc-950"
                                        checked={filtered.length > 0 && filtered.map(tx => tx.id).every(id => selectedIds.includes(id))}
                                        onChange={toggleAllSelection}
                                    />
                                </div>
                            </TableHead>
                            <TableHead className="w-[120px] cursor-pointer hover:text-white" onClick={() => toggleSort("date")}>
                                <div className="flex items-center gap-1">Data <ArrowUpDown className="h-3 w-3" /></div>
                            </TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="cursor-pointer hover:text-white" onClick={() => toggleSort("category")}>
                                <div className="flex items-center gap-1">Categoria <ArrowUpDown className="h-3 w-3" /></div>
                            </TableHead>
                            <TableHead>Conta/Cartão</TableHead>
                            <TableHead className="text-right cursor-pointer hover:text-white" onClick={() => toggleSort("amount")}>
                                <div className="flex justify-end items-center gap-1">Valor <ArrowUpDown className="h-3 w-3" /></div>
                            </TableHead>
                            <TableHead className="w-[80px] text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nenhuma transação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((tx) => (
                                <TableRow key={tx.id} className={cn(
                                    "border-zinc-800 hover:bg-zinc-900/50 transition-colors",
                                    !tx.isPaid && "opacity-60 grayscale-[0.5]",
                                    selectedIds.includes(tx.id) && "bg-emerald-500/5 border-emerald-500/20"
                                )}>
                                    <TableCell className="w-[40px]">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-zinc-950"
                                                checked={selectedIds.includes(tx.id)}
                                                onChange={() => toggleSelection(tx.id)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className={`font-medium ${!tx.isPaid ? 'text-zinc-500 italic' : 'text-muted-foreground'}`}>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(tx.id)}
                                                className="hover:scale-110 transition-transform active:scale-95 p-1 rounded-md hover:bg-zinc-800"
                                                title={tx.isPaid ? "Marcar como pendente" : "Marcar como pago"}
                                            >
                                                {!tx.isPaid ? (
                                                    <Clock className="h-4 w-4 text-orange-400" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                )}
                                            </button>
                                            {new Date(tx.date).toLocaleDateString("pt-BR")}
                                        </div>
                                    </TableCell>
                                    <TableCell className={!tx.isPaid ? 'text-zinc-400 italic' : ''}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span>{tx.description}</span>
                                                {tx.isRecurring && (
                                                    <div className="group relative">
                                                        <Repeat className="h-3 w-3 text-blue-400" />
                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-[10px] p-1.5 rounded shadow-xl whitespace-nowrap z-50">
                                                            Recorrente: {tx.recurrenceType === 'MONTHLY' ? 'Mensal' : tx.recurrenceType === 'WEEKLY' ? 'Semanal' : 'Anual'}
                                                            {tx.recurrencePeriod > 1 && ` (A cada ${tx.recurrencePeriod} ${tx.recurrenceType === 'MONTHLY' ? 'meses' : tx.recurrenceType === 'WEEKLY' ? 'semanas' : 'anos'})`}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-zinc-800 text-zinc-300">
                                            {tx.category?.name || "Sem categoria"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {tx.creditCard ? tx.creditCard.name : (tx.account ? tx.account.name : "Pix/Dinheiro")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div className="flex items-center gap-1">
                                                {tx.type === 'INCOME' ? (
                                                    <ArrowUpRight className={`h-4 w-4 ${tx.isPaid ? 'text-emerald-500' : 'text-emerald-500/40'}`} />
                                                ) : (
                                                    <ArrowDownRight className={`h-4 w-4 ${tx.isPaid ? 'text-red-500' : 'text-red-500/40'}`} />
                                                )}
                                                <span className={`font-mono font-bold text-base ${tx.type === 'INCOME' ? (tx.isPaid ? 'text-emerald-400' : 'text-emerald-400/40') : (tx.isPaid ? 'text-zinc-100' : 'text-zinc-500')} ${!tx.isPaid ? 'italic' : ''}`}>
                                                    {tx.type === 'INCOME' ? '+' : ''}
                                                    {Math.abs(Number(tx.amount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                            {!tx.isPaid && (
                                                <span className="text-[9px] font-bold text-orange-400/70 tracking-tighter uppercase pl-1">
                                                    Aguardando Efetivação
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <TransactionModal
                                                categories={categories}
                                                creditCards={creditCards}
                                                accounts={accounts}
                                                initialData={tx}
                                                trigger={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                                                onClick={() => { setTxToDelete(tx); setDeleteOpen(true); }}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deseja excluir esta transação?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-900 border-zinc-800">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                            {loading ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {selectedIds.length} transações?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação excluirá permanentemente todos os lançamentos selecionados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-900 border-zinc-800">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                            {loading ? "Excluindo..." : "Confirmar Exclusão"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
