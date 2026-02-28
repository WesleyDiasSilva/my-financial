import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

interface FinancialProjectionProps {
    transactions: any[];
    accounts: any[];
}

export function FinancialProjection({ transactions, accounts }: FinancialProjectionProps) {
    const today = new Date();
    const currentBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

    const projection = [];

    // Generate next 3 months
    for (let i = 1; i <= 3; i++) {
        const projectionDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthLabel = projectionDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        let projectedIncome = 0;
        let projectedExpense = 0;

        transactions.forEach((tx) => {
            if (!tx.isRecurring) return;

            const txDate = new Date(tx.date);
            const recurrenceType = tx.recurrenceType;
            const period = tx.recurrencePeriod || 1;

            // Simple projection logic:
            // If it's monthly, it will happen every month. 
            // Better logic: calculate if the tx hits this specific projection month based on starting date and period.

            if (recurrenceType === 'MONTHLY') {
                // How many months between txDate and projectionDate
                const monthDiff = (projectionDate.getFullYear() - txDate.getFullYear()) * 12 + (projectionDate.getMonth() - txDate.getMonth());
                if (monthDiff >= 0 && monthDiff % period === 0) {
                    if (tx.type === 'INCOME') projectedIncome += Math.abs(Number(tx.amount));
                    else projectedExpense += Math.abs(Number(tx.amount));
                }
            } else if (recurrenceType === 'WEEKLY') {
                // Roughly 4 weeks in a month for simplicity in projection
                const totalOccurrences = Math.floor(4 / period);
                if (tx.type === 'INCOME') projectedIncome += Math.abs(Number(tx.amount)) * totalOccurrences;
                else projectedExpense += Math.abs(Number(tx.amount)) * totalOccurrences;
            } else if (recurrenceType === 'YEARLY') {
                if (projectionDate.getMonth() === txDate.getMonth()) {
                    if (tx.type === 'INCOME') projectedIncome += Math.abs(Number(tx.amount));
                    else projectedExpense += Math.abs(Number(tx.amount));
                }
            }
        });

        projection.push({
            month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            income: projectedIncome,
            expense: projectedExpense,
            balance: projectedIncome - projectedExpense
        });
    }

    let runningBalance = currentBalance;

    return (
        <Card className="bg-zinc-950 border-zinc-800 col-span-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <div>
                        <CardTitle className="text-lg">Projeção de Saúde Financeira</CardTitle>
                        <CardDescription>Estimativa baseada exclusivamente em suas transações recorrentes</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                    {projection.map((p, idx) => {
                        runningBalance += p.balance;
                        const isPositive = p.balance >= 0;
                        const isSafe = runningBalance >= 0;

                        return (
                            <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-3 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${isSafe ? 'bg-emerald-500' : 'bg-red-500'}`} />

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-zinc-400">{p.month}</span>
                                    <div className={`text-[10px] px-2 py-0.5 rounded-full border ${isSafe ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                                        {isSafe ? 'Saudável' : 'Alerta'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Resultado Estimado</p>
                                    <div className={`text-xl font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        {p.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-zinc-800/50">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Saldo Final Projetado:</span>
                                        <span className={`font-mono font-bold ${isSafe ? 'text-zinc-100' : 'text-red-400'}`}>
                                            {runningBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${isSafe ? 'bg-emerald-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(100, Math.max(0, (runningBalance / (currentBalance || 1)) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
