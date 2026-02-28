import { getTransactions } from "@/actions/transaction";
import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string, year?: string }> }) {
  const transactions = await getTransactions();
  const creditCards = await getCreditCards();
  const accounts = await getAccounts();
  const categories = await getCategories();

  const params = await searchParams;
  const currentMonth = params.month ? parseInt(params.month) : new Date().getMonth();
  const currentYear = params.year ? parseInt(params.year) : new Date().getFullYear();

  return (
    <DashboardClient
      initialTransactions={transactions}
      initialCreditCards={creditCards}
      initialAccounts={accounts}
      initialCategories={categories}
      currentMonth={currentMonth}
      currentYear={currentYear}
    />
  );
}
