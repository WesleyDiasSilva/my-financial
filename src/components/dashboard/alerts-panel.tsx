import { AlertTriangle, BellRing, CheckCircle2, CreditCard, TrendingDown, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertItem {
    id: string;
    type: "danger" | "warning" | "info" | "success";
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface AlertsPanelProps {
    accounts: any[];
    creditCards: any[];
    transactions: any[];
    categories: any[];
}

export function AlertsPanel({ accounts, creditCards, transactions, categories }: AlertsPanelProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts: AlertItem[] = [];

    // 1. Contas com saldo negativo
    accounts.forEach((acc) => {
        if (Number(acc.balance) < 0) {
            alerts.push({
                id: `neg-${acc.id}`,
                type: "danger",
                icon: <TrendingDown className="h-4 w-4" />,
                title: `Saldo negativo — ${acc.name}`,
                description: `Conta está em ${Number(acc.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Verifique suas despesas.`,
            });
        }
    });

    // 2. Faturas de cartão vencendo em até 5 dias
    creditCards.forEach((card) => {
        const dueDay = card.dueDay;
        const dueDateThisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
        const dueDateNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
        const targetDate = dueDateThisMonth >= today ? dueDateThisMonth : dueDateNextMonth;
        const daysUntilDue = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const invoiceMonth = targetDate.getMonth();
        const invoiceYear = targetDate.getFullYear();
        const monthlyInvoice = (card.transactions || [])
            .filter((tx: any) => {
                const d = new Date(tx.date);
                return d.getMonth() === invoiceMonth && d.getFullYear() === invoiceYear;
            })
            .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount)), 0);

        if (daysUntilDue <= 5 && monthlyInvoice > 0) {
            alerts.push({
                id: `card-${card.id}`,
                type: daysUntilDue <= 2 ? "danger" : "warning",
                icon: <CreditCard className="h-4 w-4" />,
                title: `Fatura vence em ${daysUntilDue} dia${daysUntilDue !== 1 ? 's' : ''} — ${card.name}`,
                description: `Valor da fatura: ${monthlyInvoice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Vencimento dia ${dueDay}.`,
            });
        }
    });

    // 3. Transações pendentes com data já vencida
    const overdueTransactions = transactions.filter((tx: any) => {
        if (tx.isPaid) return false;
        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);
        return txDate < today;
    });

    if (overdueTransactions.length > 0) {
        const total = overdueTransactions.reduce((acc: number, tx: any) => acc + Math.abs(Number(tx.amount)), 0);
        alerts.push({
            id: "overdue-txs",
            type: "warning",
            icon: <Clock className="h-4 w-4" />,
            title: `${overdueTransactions.length} transaç${overdueTransactions.length !== 1 ? 'ões' : 'ão'} pendente${overdueTransactions.length !== 1 ? 's' : ''} vencida${overdueTransactions.length !== 1 ? 's' : ''}`,
            description: `Total em aberto: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Acesse Transações para regularizar.`,
        });
    }

    // 4. Categorias ultrapassando limite mensal
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    categories.forEach((cat: any) => {
        if (!cat.monthlyLimit) return;
        const limit = Number(cat.monthlyLimit);
        if (limit <= 0) return;

        const spent = transactions
            .filter((tx: any) => {
                const d = new Date(tx.date);
                return (
                    tx.categoryId === cat.id &&
                    tx.type === "EXPENSE" &&
                    d.getMonth() === currentMonth &&
                    d.getFullYear() === currentYear
                );
            })
            .reduce((acc: number, tx: any) => acc + Math.abs(Number(tx.amount)), 0);

        const pct = (spent / limit) * 100;

        if (pct >= 100) {
            alerts.push({
                id: `cat-limit-${cat.id}`,
                type: "danger",
                icon: <AlertTriangle className="h-4 w-4" />,
                title: `Limite ultrapassado — ${cat.name}`,
                description: `Gasto de ${spent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de ${limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${Math.round(pct)}%)`,
            });
        } else if (pct >= 80) {
            alerts.push({
                id: `cat-warn-${cat.id}`,
                type: "warning",
                icon: <AlertTriangle className="h-4 w-4" />,
                title: `Limite quase atingido — ${cat.name}`,
                description: `${Math.round(pct)}% do limite usado. Restam ${(limit - spent).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
            });
        }
    });

    const colorMap = {
        danger: {
            card: "border-red-800/50 bg-red-950/20",
            icon: "text-red-400 bg-red-500/10",
            title: "text-red-300",
            desc: "text-red-400/70",
        },
        warning: {
            card: "border-orange-800/50 bg-orange-950/20",
            icon: "text-orange-400 bg-orange-500/10",
            title: "text-orange-300",
            desc: "text-orange-400/70",
        },
        info: {
            card: "border-blue-800/50 bg-blue-950/20",
            icon: "text-blue-400 bg-blue-500/10",
            title: "text-blue-300",
            desc: "text-blue-400/70",
        },
        success: {
            card: "border-emerald-800/50 bg-emerald-950/20",
            icon: "text-emerald-400 bg-emerald-500/10",
            title: "text-emerald-300",
            desc: "text-emerald-400/70",
        },
    };

    return (
        <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-zinc-900 p-1.5 rounded-md">
                        <BellRing className="h-4 w-4 text-yellow-400" />
                    </div>
                    <CardTitle className="text-base font-semibold">Central de Alertas</CardTitle>
                    {alerts.length > 0 && (
                        <span className="ml-auto text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                            {alerts.length}
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                        <div className="bg-emerald-500/10 p-3 rounded-full">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <p className="text-sm font-medium text-emerald-400">Tudo em ordem!</p>
                        <p className="text-xs text-muted-foreground">Nenhum alerta financeiro no momento.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert) => {
                            const c = colorMap[alert.type];
                            return (
                                <div key={alert.id} className={`flex items-start gap-3 rounded-lg border p-3 ${c.card}`}>
                                    <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${c.icon}`}>
                                        {alert.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-semibold leading-snug ${c.title}`}>{alert.title}</p>
                                        <p className={`text-xs mt-0.5 ${c.desc}`}>{alert.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
