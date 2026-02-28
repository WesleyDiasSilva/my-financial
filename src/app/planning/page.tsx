import { getCategories } from "@/actions/category";
import { getTransactions } from "@/actions/transaction";
import { getMonthlyIncome } from "@/actions/user";
import { CategoryModal } from "@/components/modals/category-modal";
import { PlanningSummary } from "@/components/planning/planning-summary";
import { PlanningList } from "@/components/planning/planning-list";
import { SeedButton } from "@/components/planning/seed-button";

export default async function PlanningPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await searchParamsPromise;
    const categoriesRaw = await getCategories();
    const transactionsRaw = await getTransactions();
    const monthlyIncome = await getMonthlyIncome();

    // Serialize Decimals for Client Components
    const categories = categoriesRaw.map((c: any) => ({
        ...c,
        monthlyLimit: c.monthlyLimit ? Number(c.monthlyLimit) : null
    }));

    const transactions = transactionsRaw.map((t: any) => ({
        ...t,
        amount: Number(t.amount)
    }));

    // Sort params
    const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : 'name';
    const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder : 'asc';

    const expenses = categories.filter((c: any) => c.type === 'EXPENSE');
    const incomes = categories.filter((c: any) => c.type === 'INCOME');

    const totalLimits = expenses.reduce((acc: number, c: any) => acc + Number(c.monthlyLimit || 0), 0);

    return (
        <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto p-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Planejamento</h2>
                    <p className="text-zinc-500 mt-1 text-lg font-medium">Defina suas metas e controle sua saúde financeira</p>
                </div>
                <div className="flex items-center gap-3">
                    <SeedButton />
                    <CategoryModal />
                </div>
            </div>

            {/* Summary Section */}
            <PlanningSummary plannedIncome={monthlyIncome} totalLimits={totalLimits} />

            {/* List Section - Restored side-by-side with better grid to avoid squishing */}
            <div className="grid lg:grid-cols-2 gap-x-16 gap-y-16 items-start">
                <PlanningList
                    title="Minhas Despesas"
                    type="EXPENSE"
                    items={expenses}
                    transactions={transactions}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                />

                <PlanningList
                    title="Minhas Receitas"
                    type="INCOME"
                    items={incomes}
                    transactions={transactions}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                />
            </div>
        </div>
    );
}
