import { getTransactions } from "@/actions/transaction";
import { getCategories } from "@/actions/category";
import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { TransactionList } from "@/components/transactions/transaction-list";
import { ClearTransactionsButton } from "@/components/transactions/clear-transactions-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Wallet, Info } from "lucide-react";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const initialAccountFilter = typeof params.account === 'string' ? params.account : 'all';
    const initialStatusFilter = typeof params.status === 'string' ? params.status : 'all';

    const transactions = await getTransactions();
    const categories = await getCategories();
    const creditCards = await getCreditCards();
    const accounts = await getAccounts();

    // Calculate current month's totals excluding credit cards
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !t.creditCardId; // Explicitly ignoring credit cards
    });

    const income = currentMonthTxs
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const expense = currentMonthTxs
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const liquidBalance = income - expense;

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Transações de Conta</h2>
                    <p className="text-zinc-500 mt-1 text-lg font-medium">Gestão de Dinheiro, PIX e Débito (Não inclui Cartão de Crédito).</p>
                </div>
                <div className="flex items-center gap-3">
                    <ClearTransactionsButton count={transactions.length} />
                    <TransactionModal categories={categories} creditCards={creditCards} accounts={accounts} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-500">
                            Entradas (PIX/Cash)
                        </CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">
                            {income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-500">
                            Saídas (Débito/PIX)
                        </CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-400">
                            {expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-300">
                            Saldo Líquido
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-100">
                            {liquidBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-start gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">
                    <strong>Atenção:</strong> Transações de crédito devem ser feitas na aba específica de Cartões. Esta área exibe transações de contas correntes ou lançamentos manuais.
                </p>
            </div>

            <TransactionList
                transactions={transactions}
                categories={categories}
                creditCards={creditCards}
                accounts={accounts}
                initialAccountFilter={initialAccountFilter}
                initialStatusFilter={initialStatusFilter}
            />
        </div>
    );
}
