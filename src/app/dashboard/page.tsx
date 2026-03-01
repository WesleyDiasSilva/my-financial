import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTransactions } from "@/actions/transaction";
import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { DashboardClient } from "./dashboard-client";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string, year?: string, admin?: string }> }) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  // If admin mode is active and user is admin, show admin dashboard
  if (params.admin === "true" && (session?.user as any)?.isAdmin) {
    return <AdminDashboard />;
  }

  const transactions = await getTransactions();
  const creditCards = await getCreditCards();
  const accounts = await getAccounts();
  const categories = await getCategories();

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
