"use client";

import { useState, useMemo, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Filter, Search, MoreHorizontal, Trash, Edit, ArrowUpDown, Clock, CheckCircle2, Repeat, MinusCircle, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteTransaction, deleteTransactions, toggleTransactionPaid, ignoreDuplicateTransactions } from "@/actions/transaction";
import { analyzeDuplicates, parseNaturalLanguageSearch, batchCategorizeTransactions } from "@/actions/ai-transactions";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState as useStateReact } from "react";

export function TransactionList({ transactions, categories, creditCards, accounts, initialAccountFilter = "all", initialStatusFilter = "all" }: { transactions: any[], categories: any[], creditCards: any[], accounts: any[], initialAccountFilter?: string, initialStatusFilter?: string }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");
    const [accountFilter, setAccountFilter] = useState(initialAccountFilter);
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [txToDelete, setTxToDelete] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    // AI States
    const [duplicateIds, setDuplicateIds] = useState<string[]>([]);
    const [isAnalyzingDupes, setIsAnalyzingDupes] = useState(true);
    const [aiSearchLoading, setAiSearchLoading] = useState(false);
    const [aiCategorizationLoading, setAiCategorizationLoading] = useState(false);
    const [aiFiltersActive, setAiFiltersActive] = useState(false);

    const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);
    const [aiSearchTitle, setAiSearchTitle] = useState<string | null>(null);
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

    const prevTxLengthRef = useRef(transactions.length);
    const hasMountedRef = useRef(false);
    const [lastDupeCheck, setLastDupeCheck] = useState<Date | null>(null);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (cooldownRemaining > 0) {
            interval = setInterval(() => {
                setCooldownRemaining((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [cooldownRemaining]);

    // Auto-analyze duplicates on load
    useEffect(() => {
        const isMount = !hasMountedRef.current;
        hasMountedRef.current = true;

        if (!isMount) {
            // Previne rodar novamente se for apenas atualização (mesmo tamanho) ou exclusão (diminuição)
            if (transactions.length <= prevTxLengthRef.current) {
                prevTxLengthRef.current = transactions.length;
                return;
            }
        }

        prevTxLengthRef.current = transactions.length;

        setIsAnalyzingDupes(true);
        analyzeDuplicates().then(ids => {
            setDuplicateIds(ids);
            setLastDupeCheck(new Date());
        }).finally(() => setIsAnalyzingDupes(false));
    }, [transactions]);

    const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchTerm.trim().length > 3) {
            e.preventDefault();
            setAiSearchLoading(true);
            try {
                toast.loading("A IA está interpretando sua busca...", { id: "ai-search" });
                const txPayload = transactions.map(t => ({
                    id: t.id,
                    description: t.description,
                    date: new Date(t.date).toISOString().split("T")[0],
                    amount: Number(t.amount),
                    type: t.type,
                    categoryName: t.category?.name || "Sem Categoria",
                    isPaid: t.isPaid
                }));

                const result = await parseNaturalLanguageSearch(searchTerm, txPayload);
                if (result && result.matchedIds) {
                    setAiMatchedIds(result.matchedIds);
                    setAiSearchTitle(result.title || null);

                    // Se a IA encontrou algo, liberamos os outros escopos front-end para não dar conflito.
                    setTypeFilter("all");
                    setMonthFilter("all");
                    setAccountFilter("all");
                    setStatusFilter("all");
                    setSearchTerm("");

                    setAiFiltersActive(true);
                    toast.success("Filtros aplicados pela IA!", { id: "ai-search" });
                } else {
                    toast.dismiss("ai-search");
                }
            } catch (err) {
                toast.error("Erro ao buscar via IA.", { id: "ai-search" });
            } finally {
                setAiSearchLoading(false);
            }
        }
    };

    const handleManualDupeCheck = async () => {
        if (cooldownRemaining > 0) return;

        setIsAnalyzingDupes(true);
        setCooldownRemaining(60);
        toast.loading("Procurando suspeitas na base...", { id: "manual-dupe" });

        try {
            const ids = await analyzeDuplicates();
            setDuplicateIds(ids);
            setLastDupeCheck(new Date());
            if (ids.length > 0) {
                toast.success(`${ids.length} possível(eis) duplicada(s) encontrada(s)!`, { id: "manual-dupe" });
            } else {
                toast.success("Tudo limpo! Nenhuma duplicata encontrada.", { id: "manual-dupe" });
            }
        } catch {
            toast.error("Falha ao analisar duplicatas.", { id: "manual-dupe" });
        } finally {
            setIsAnalyzingDupes(false);
        }
    };

    const handleBatchCategorize = async () => {
        setAiCategorizationLoading(true);
        try {
            toast.loading("Analisando seu histórico para categorizar...", { id: "ai-batch" });
            const result = await batchCategorizeTransactions();
            if (result && result.success) {
                toast.success(`Pronto! ${result.count} transação(ões) categorizada(s) pela IA.`, { id: "ai-batch" });
                // We rely on router refresh to update data.
                window.location.reload();
            } else {
                toast.dismiss("ai-batch");
            }
        } catch (err) {
            toast.error("Erro na categorização em lote.", { id: "ai-batch" });
        } finally {
            setAiCategorizationLoading(false);
        }
    };

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

    const toggleSelection = (e: React.MouseEvent, id: string, index: number) => {
        if (e.shiftKey && lastSelectedIdx !== null) {
            const start = Math.min(lastSelectedIdx, index);
            const end = Math.max(lastSelectedIdx, index);

            // Get all IDs in the range based on the current sorted/filtered list
            const idsInRange = filtered.slice(start, end + 1).map(tx => tx.id);

            setSelectedIds(prev => {
                const newSelection = new Set(prev);
                idsInRange.forEach(rangeId => newSelection.add(rangeId));
                return Array.from(newSelection);
            });
        } else {
            setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
        setLastSelectedIdx(index);
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
            // Filtro de duplicatas tem prioridade absoluta
            if (showDuplicatesOnly) {
                return duplicateIds.includes(tx.id);
            }

            if (aiFiltersActive && aiMatchedIds !== null) {
                return aiMatchedIds.includes(tx.id);
            }

            // Search by description or value
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = tx.description.toLowerCase().includes(searchLower) || String(tx.amount).includes(searchLower);

            // Type
            const matchType = typeFilter === "all" || (typeFilter === "income" && tx.type === "INCOME") || (typeFilter === "expense" && tx.type === "EXPENSE") || (typeFilter === "transfer" && tx.type === "TRANSFER");

            // Month
            const txMonth = new Date(tx.date).getMonth() + 1; // 1 to 12
            const txYear = new Date(tx.date).getFullYear();
            const txMonthKey = `${txYear} -${txMonth.toString().padStart(2, '0')} `;
            const matchMonth = monthFilter === "all" || monthFilter === txMonthKey;

            // Status Filter
            const matchStatus = statusFilter === "all" || (statusFilter === "paid" && tx.isPaid) || (statusFilter === "pending" && !tx.isPaid);

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

            // Duplicates Filter
            const matchDuplicates = !showDuplicatesOnly || duplicateIds.includes(tx.id);

            return matchSearch && matchType && matchMonth && matchStatus && matchAcct && matchDuplicates;
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
    }, [transactions, searchTerm, typeFilter, monthFilter, statusFilter, accountFilter, sortConfig, creditCards, aiFiltersActive, aiMatchedIds, showDuplicatesOnly, duplicateIds]);

    const availableMonths = useMemo(() => {
        const unique = new Set<string>();
        transactions.forEach(tx => {
            const d = new Date(tx.date);
            unique.add(`${d.getFullYear()} -${(d.getMonth() + 1).toString().padStart(2, '0')} `);
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
            <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-medium text-zinc-400">
                    Exibindo {filtered.length} de {transactions.length} registros de conta
                </p>
            </div>

            {duplicateIds.length > 0 && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500 flex shrink-0"><Filter className="w-5 h-5" /></span>
                        <p className="text-sm text-amber-200/80">
                            A IA detectou <span className="font-bold">{duplicateIds.length}</span> possíveis transações duplicadas neste período.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                const idsToIgnore = [...duplicateIds];
                                setDuplicateIds([]);
                                setShowDuplicatesOnly(false);

                                toast.promise(
                                    ignoreDuplicateTransactions(idsToIgnore),
                                    {
                                        loading: 'Ignorando permanentemente...',
                                        success: 'Feito! A IA não te alertará mais sobre essas transações.',
                                        error: 'Erro ao ignorar transações.'
                                    }
                                );
                            }}
                            className="text-xs font-bold uppercase tracking-wider px-3 py-1 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors cursor-pointer"
                        >
                            Ignorar
                        </button>
                        <button
                            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                            className={cn(
                                "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg transition-colors cursor-pointer",
                                showDuplicatesOnly ? "bg-amber-600 text-black hover:bg-amber-700" : "bg-amber-500 text-black hover:bg-amber-600"
                            )}
                        >
                            {showDuplicatesOnly ? "Remover Filtro" : "Verificar"}
                        </button>
                    </div>
                </div>
            )}

            {duplicateIds.length === 0 && lastDupeCheck && !isAnalyzingDupes && (
                <div className="mt-4 flex items-center gap-2 px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                    <p className="text-xs text-zinc-500 font-medium">
                        0 duplicadas encontradas - última verificação {lastDupeCheck.toLocaleDateString('pt-BR')} às {lastDupeCheck.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <button
                        onClick={handleManualDupeCheck}
                        disabled={cooldownRemaining > 0 || isAnalyzingDupes}
                        title={cooldownRemaining > 0 ? `Aguarde ${cooldownRemaining}s` : "Avaliar novamente"}
                        className="p-1 hover:bg-zinc-800 rounded-md transition-all text-zinc-500 hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isAnalyzingDupes && "animate-spin")} />
                        {cooldownRemaining > 0 && <span className="text-[10px] font-mono">{cooldownRemaining}s</span>}
                    </button>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="relative flex-[1_1_300px] min-w-[200px]">
                    <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${aiSearchLoading ? 'text-purple-400 animate-pulse' : 'text-muted-foreground'}`} />
                    <Input
                        type="search"
                        placeholder="Pergunte à IA: 'Filtrar despesas do mês passado?' ou busque algo..."
                        className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500 italic transition-all"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (aiFiltersActive) {
                                setAiFiltersActive(false);
                                setAiMatchedIds(null);
                                setAiSearchTitle(null);
                                setTypeFilter("all");
                            }
                        }}
                        onKeyDown={handleSearchKeyDown}
                        disabled={aiSearchLoading}
                    />
                    {aiFiltersActive && (
                        <button
                            onClick={() => { setAiFiltersActive(false); setSearchTerm(""); setTypeFilter("all"); setAiMatchedIds(null); setAiSearchTitle(null); setMonthFilter("all"); setStatusFilter("all"); setAccountFilter("all"); }}
                            className="absolute right-2 top-1.5 p-1 text-xs bg-purple-500/20 text-purple-400 rounded-md hover:bg-purple-500/40"
                        >
                            Limpar Filtros IA
                        </button>
                    )}
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
                        <SelectItem value="transfer">Transferências</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-800 flex-shrink-0">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="paid">Efetivadas</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
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
                {transactions.some(tx => !tx.categoryId) && (
                    <Button
                        onClick={handleBatchCategorize}
                        disabled={aiCategorizationLoading}
                        variant="outline"
                        className="border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 font-bold"
                    >
                        {aiCategorizationLoading ? "Analisando..." : "Categorizar Tudo com IA"}
                    </Button>
                )}
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
                                        className="appearance-none relative h-4 w-4 rounded-full border border-zinc-700 bg-zinc-900 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 checked:bg-emerald-500 checked:border-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[5px] after:w-[4px] after:h-[8px] after:border-b-2 after:border-r-2 after:border-white after:rotate-45 after:opacity-0 checked:after:opacity-100"
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
                            <TableHead>Conta</TableHead>
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
                                                className="appearance-none relative h-4 w-4 rounded-full border border-zinc-700 bg-zinc-900 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 checked:bg-emerald-500 checked:border-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[5px] after:w-[4px] after:h-[8px] after:border-b-2 after:border-r-2 after:border-white after:rotate-45 after:opacity-0 checked:after:opacity-100"
                                                checked={selectedIds.includes(tx.id)}
                                                onChange={() => { }} // dummy onChange to silence react warning, onClick handles the logic
                                                onClick={(e) => toggleSelection(e, tx.id, filtered.findIndex(t => t.id === tx.id))}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className={`font - medium ${!tx.isPaid ? 'text-zinc-500 italic' : 'text-muted-foreground'} `}>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(tx.id)}
                                                className="hover:scale-110 transition-transform active:scale-95 p-1 rounded-md hover:bg-zinc-800"
                                                title={tx.isPaid ? "Marcar como pendente" : "Marcar como pago"}
                                            >
                                                {!tx.isPaid ? (
                                                    <Clock className="h-4 w-4 text-orange-400" />
                                                ) : tx.type === 'TRANSFER' ? (
                                                    <ArrowLeftRight className="h-4 w-4 text-cyan-400" />
                                                ) : tx.type === 'INCOME' ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <MinusCircle className="h-4 w-4 text-red-500" />
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
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-zinc-800 text-zinc-300">
                                                {tx.category?.name || "Sem categoria"}
                                            </span>
                                            {tx.isAiCategorized && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black rounded bg-purple-500 text-white uppercase shadow-sm">
                                                    IA
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {tx.creditCard ? tx.creditCard.name : (tx.account ? tx.account.name : "Pix/Dinheiro")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div className="flex items-center gap-1">
                                                {tx.type === 'INCOME' ? (
                                                    <ArrowUpRight className={`h - 4 w - 4 ${tx.isPaid ? 'text-emerald-500' : 'text-emerald-500/40'} `} />
                                                ) : tx.type === 'TRANSFER' ? (
                                                    <ArrowLeftRight className={`h - 4 w - 4 ${tx.isPaid ? 'text-cyan-400' : 'text-cyan-400/40'} `} />
                                                ) : (
                                                    <ArrowDownRight className={`h - 4 w - 4 ${tx.isPaid ? 'text-red-500' : 'text-red-500/40'} `} />
                                                )}
                                                <span className={`font - mono font - bold text - base ${tx.type === 'INCOME' ? (tx.isPaid ? 'text-emerald-400' : 'text-emerald-400/40') : tx.type === 'TRANSFER' ? (tx.isPaid ? 'text-cyan-400' : 'text-cyan-400/40') : (tx.isPaid ? 'text-zinc-100' : 'text-zinc-500')} ${!tx.isPaid ? 'italic' : ''} `}>
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
