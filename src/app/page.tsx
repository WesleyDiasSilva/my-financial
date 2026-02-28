import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, CreditCard, DollarSign } from "lucide-react";
import { Overview } from "@/components/dashboard/overview";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { FinancialProjection } from "@/components/dashboard/financial-projection";
import { getTransactions } from "@/actions/transaction";
import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { MonthFilter } from "@/components/dashboard/month-filter";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";


export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string, year?: string }> }) {
  const transactions = await getTransactions();
  const creditCards = await getCreditCards();
  const accounts = await getAccounts();
  const categories = await getCategories();

  const totalAccountBalance = accounts.reduce((acc: number, a: any) => acc + Number(a.balance), 0);
  const totalInvestments = accounts.reduce((acc: number, a: any) => acc + Number(a.investmentBalance), 0);

  const params = await searchParams;
  const currentMonth = params.month ? parseInt(params.month) : new Date().getMonth();
  const currentYear = params.year ? parseInt(params.year) : new Date().getFullYear();

  // Filter transactions of the current month
  const monthlyTransactions = transactions.filter((t: any) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = monthlyTransactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

  const expense = monthlyTransactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

  const availableBalance = income - expense;

  const monthlyInvoices = creditCards.reduce((acc: number, card: any) => {
    const cardSpent = (card.transactions || [])
      .filter((tx: any) => {
        const d = new Date(tx.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0);
    return acc + cardSpent;
  }, 0);

  const totalCreditDebt = creditCards.reduce((acc: number, card: any) => {
    const cardDebt = (card.transactions || [])
      .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0);
    return acc + cardDebt;
  }, 0);

  // Generate 6 months chart data
  const monthsStr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const chartData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth, 1);
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();

    const monthTxs = transactions.filter((t: any) => {
      const td = new Date(t.date);
      return td.getMonth() === m && td.getFullYear() === y;
    });

    const mIncome = monthTxs.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);
    const mExpense = monthTxs.filter((t: any) => t.type === 'EXPENSE').reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

    chartData.push({
      name: monthsStr[m],
      receita: mIncome,
      despesa: mExpense
    });
  }

  const allUnpaidCreditTransactions = transactions
    .filter((t: any) => t.creditCardId && !t.isPaid)
    .reduce((acc: number, t: any) => acc + Math.abs(Number(t.amount)), 0);

  const realLiquidity = totalAccountBalance + totalInvestments - allUnpaidCreditTransactions;

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto p-10">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Dashboard Geral</h2>
        <div className="flex items-center space-x-4">
          <MonthFilter currentMonth={currentMonth} currentYear={currentYear} />
          <TransactionModal categories={categories} creditCards={creditCards} accounts={accounts} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-2xl border-zinc-800/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-20 w-20 text-emerald-500 -rotate-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Saldo Líquido Real</CardTitle>
            <Wallet className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-black", realLiquidity >= 0 ? "text-emerald-400" : "text-red-500")}>
              {realLiquidity.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
              Contas + Investimentos - Cartões
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-2xl border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Total Investido</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-400">{totalInvestments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Patrimônio em investimentos</p>
          </CardContent>
        </Card>
        <Card className="shadow-2xl border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Fatura do Mês</CardTitle>
            <CreditCard className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-400">{monthlyInvoices.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">Total no cartão:</span>
              <span className="text-[9px] font-black text-zinc-400">{totalCreditDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-2xl border-zinc-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Resultado do Mês</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${availableBalance >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
              {availableBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Receitas - Despesas (Mensal)</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      <AlertsPanel
        accounts={accounts}
        creditCards={creditCards}
        transactions={transactions}
        categories={categories}
      />

      <FinancialProjection
        accounts={accounts}
        transactions={transactions}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral (Últimos 6 meses)</CardTitle>
            <CardDescription>
              Comparativo entre receitas e despesas
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Gastos Recentes</CardTitle>
            <CardDescription>
              As últimas 5 transações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {monthlyTransactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.category?.name || "Sem categoria"} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className={`ml-auto font-medium ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{Math.abs(Number(tx.amount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              ))}
              {monthlyTransactions.length === 0 && (
                <div className="text-sm text-center text-muted-foreground pt-4">Nenhuma transação encontrada.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
