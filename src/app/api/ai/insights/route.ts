import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeminiProvider } from "@/lib/ai/providers/gemini";

interface AIInsight {
    type: "saving" | "alert" | "opportunity";
    icon: string;
    title: string;
    description: string;
    actionLabel: string;
    accentColor: string;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);

        const [transactions, accounts, categories, goals, creditCards] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId, date: { gte: threeMonthsAgo } },
                include: { category: true },
                orderBy: { date: "desc" },
            }),
            prisma.account.findMany({ where: { userId } }),
            prisma.category.findMany({ where: { userId } }),
            prisma.goal.findMany({ where: { userId } }),
            prisma.creditCard.findMany({
                where: { userId },
                include: { transactions: { where: { date: { gte: threeMonthsAgo } } } },
            }),
        ]);

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const thisMonthTxs = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const lastMonthTxs = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
        const totalInvestments = accounts.reduce((acc, a) => acc + Number(a.investmentBalance), 0);

        const thisMonthIncome = thisMonthTxs.filter(t => t.type === "INCOME").reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const thisMonthExpense = thisMonthTxs.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const lastMonthIncome = lastMonthTxs.filter(t => t.type === "INCOME").reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const lastMonthExpense = lastMonthTxs.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

        // Gastos por categoria este mês
        const categorySpending: Record<string, { name: string; spent: number; limit: number }> = {};
        thisMonthTxs.filter(t => t.type === "EXPENSE").forEach(t => {
            const catName = t.category?.name || "Outros";
            const catLimit = Number(t.category?.monthlyLimit || 0);
            if (!categorySpending[catName]) categorySpending[catName] = { name: catName, spent: 0, limit: catLimit };
            categorySpending[catName].spent += Math.abs(Number(t.amount));
        });

        const goalsStr = goals.map(g =>
            `- ${g.name}: ${Number(g.currentAmount).toFixed(2)}/${Number(g.targetAmount).toFixed(2)} (${((Number(g.currentAmount) / Number(g.targetAmount)) * 100).toFixed(0)}%)`
        ).join("\n");

        const prompt = `Você é um consultor financeiro pessoal de elite. Analise os dados abaixo e gere EXATAMENTE 3 insights acionáveis em JSON.

## Dados Financeiros do Usuário
- Saldo em contas: R$ ${totalBalance.toFixed(2)}
- Total investido: R$ ${totalInvestments.toFixed(2)}
- Receita este mês: R$ ${thisMonthIncome.toFixed(2)}
- Despesa este mês: R$ ${thisMonthExpense.toFixed(2)}
- Receita mês passado: R$ ${lastMonthIncome.toFixed(2)}
- Despesa mês passado: R$ ${lastMonthExpense.toFixed(2)}
- Variação despesa: ${lastMonthExpense > 0 ? (((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100).toFixed(1) : "N/A"}%

## Gastos por Categoria
${Object.values(categorySpending).map(c => `- ${c.name}: R$ ${c.spent.toFixed(2)} (limite: ${c.limit > 0 ? `R$ ${c.limit.toFixed(2)}` : "sem limite"})`).join("\n")}

## Metas
${goalsStr || "Nenhuma meta definida"}

## Faturas de Cartão
${creditCards.map(c => `- ${c.name}: R$ ${(c.transactions || []).reduce((s: number, tx: any) => s + Math.abs(Number(tx.amount)), 0).toFixed(2)} (limite: R$ ${Number(c.limit).toFixed(2)})`).join("\n")}

## Regras
1. Primeiro insight: tipo "saving" - identifique uma economia real ou potencial (ex: categoria com redução de gastos, valor que pode ir para meta)
2. Segundo insight: tipo "alert" - identifique um risco (ex: categoria perto do limite, gastos crescentes, fatura alta)
3. Terceiro insight: tipo "opportunity" - identifique uma oportunidade estratégica (ex: investir sobra, realocar, meta atingível)

Responda APENAS com um JSON array, sem markdown, sem explicação:
[
  {
    "type": "saving",
    "title": "título curto em português",
    "description": "descrição prática até 120 caracteres em português",
    "actionLabel": "label do botão de ação"
  },
  {
    "type": "alert",
    "title": "...",
    "description": "...",
    "actionLabel": "..."
  },
  {
    "type": "opportunity",
    "title": "...",
    "description": "...",
    "actionLabel": "..."
  }
]`;

        const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const rawInsights = await ai.json<any[]>(prompt, {
            temperature: 0.6,
        });

        const colorMap: Record<string, { icon: string; accentColor: string }> = {
            saving: { icon: "savings", accentColor: "accent" },
            alert: { icon: "warning", accentColor: "orange" },
            opportunity: { icon: "trending_up", accentColor: "blue" },
        };

        const insights: AIInsight[] = (Array.isArray(rawInsights) ? rawInsights : []).map(i => ({
            type: i.type,
            icon: colorMap[i.type]?.icon || "auto_awesome",
            title: i.title,
            description: i.description,
            actionLabel: i.actionLabel,
            accentColor: colorMap[i.type]?.accentColor || "accent",
        }));

        return NextResponse.json({ insights });
    } catch (error) {
        console.error("[AI Insights] Error:", error);
        return NextResponse.json({ insights: [] });
    }
}
