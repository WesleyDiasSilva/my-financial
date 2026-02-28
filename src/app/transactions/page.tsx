import { getTransactions } from "@/actions/transaction";
import { getCategories } from "@/actions/category";
import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { TransactionList } from "@/components/transactions/transaction-list";
import { ClearTransactionsButton } from "@/components/transactions/clear-transactions-button";

export default async function TransactionsPage() {
    const transactions = await getTransactions();
    const categories = await getCategories();
    const creditCards = await getCreditCards();
    const accounts = await getAccounts();

    return (
        <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Transações</h2>
                    <p className="text-zinc-500 mt-1 text-lg font-medium">Gerencie seu fluxo de caixa, receitas e despesas</p>
                </div>
                <div className="flex items-center gap-3">
                    <ClearTransactionsButton count={transactions.length} />
                    <TransactionModal categories={categories} creditCards={creditCards} accounts={accounts} />
                </div>
            </div>

            <TransactionList transactions={transactions} categories={categories} creditCards={creditCards} accounts={accounts} />
        </div>
    );
}
