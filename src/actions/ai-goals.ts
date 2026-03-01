"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeminiProvider } from "@/lib/ai/providers/gemini";

export interface GoalInsight {
    title: string;
    message: string;
    suggestion: string;
}

export async function getGoalInsights() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const userId = session.user.id;
        const today = new Date();

        // Dados do mês passado para análise de "sobras"
        const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        const [goals, categories, transactions] = await Promise.all([
            prisma.goal.findMany({ where: { userId } }),
            prisma.category.findMany({ where: { userId } }),
            prisma.transaction.findMany({
                where: {
                    userId,
                    date: { gte: startOfPreviousMonth, lte: endOfPreviousMonth }
                },
                include: { category: true }
            })
        ]);

        if (goals.length === 0) return null;

        // Calcular "Economia Mensal" (Surplus) do mês passado
        const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
        const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
        const surplus = income - expense;

        // Calcular "sobras" por categoria (Limite - Gasto Real)
        const categoryUsage: Record<string, number> = {};
        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            if (t.categoryId) {
                categoryUsage[t.categoryId] = (categoryUsage[t.categoryId] || 0) + Math.abs(Number(t.amount));
            }
        });

        const leftovers = categories
            .filter(c => c.monthlyLimit && Number(c.monthlyLimit) > 0)
            .map(c => ({
                name: c.name,
                limit: Number(c.monthlyLimit),
                spent: categoryUsage[c.id] || 0,
                diff: Number(c.monthlyLimit) - (categoryUsage[c.id] || 0)
            }))
            .filter(l => l.diff > 10); // Apenas sobras acima de R$ 10

        const goalsStr = goals.map(g =>
            `- ${g.name}: R$ ${Number(g.currentAmount).toFixed(2)} de R$ ${Number(g.targetAmount).toFixed(2)} (Falta R$ ${(Number(g.targetAmount) - Number(g.currentAmount)).toFixed(2)})`
        ).join("\n");

        const leftStr = leftovers.map(l =>
            `- ${l.name}: Gastou R$ ${l.spent.toFixed(2)} de um limite de R$ ${l.limit.toFixed(2)} (Sobrou R$ ${l.diff.toFixed(2)})`
        ).join("\n");

        const prompt = `Você é um mentor financeiro motivacional altamente estratégico. Analise o progresso das metas do usuário e as sobras de orçamento do mês anterior.
Seu objetivo é dar uma sugestão real de como as sobras do orçamento atual podem ser usadas para acelerar o batimento das metas.

## Metas Atuais
${goalsStr || "Nenhuma meta definida"}

## Sobras de Orçamento (Economia por categoria no mês anterior)
${leftStr || "Nenhuma sobra significativa em categorias com limite."}

## Saldo Líquido do Mês Anterior (Receita - Despesa)
R$ ${surplus.toFixed(2)}

## Instruções de Resposta:
1. Comece com um título que anime o usuário (ex: "Sua Viagem está mais perto do que você imagina!").
2. Na mensagem, explique brevemente o impacto de usar alguma sobra específica (ex: "Seus R$ 150 economizados em Lazer podem virar patrimônio").
3. Na sugestão, seja matemático: diga quanto alocar e quanto tempo isso economizaria (estimativa livre) na meta.
4. Se o saldo líquido for negativo, mude o tom para conselheiro de redução de danos.

Responda APENAS com um JSON objeto, sem markdown:
{
  "title": "Título",
  "message": "Mensagem curta em português",
  "suggestion": "Sugestão prática"
}`;

        const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const insight = await ai.json<GoalInsight>(prompt, { temperature: 0.6 });

        return insight;
    } catch (error) {
        console.error("[Goal Insights] Error:", error);
        return null;
    }
}

export async function getGoalStats() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const userId = session.user.id;
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);

        const [goals, historyTransactions, accounts] = await Promise.all([
            prisma.goal.findMany({ where: { userId } }),
            prisma.transaction.findMany({
                where: { userId, date: { gte: sixMonthsAgo } },
                select: { amount: true, type: true, date: true }
            }),
            prisma.account.findMany({ where: { userId } })
        ]);

        const totalSavedInGoals = goals.reduce((s, g) => s + Number(g.currentAmount), 0);
        const totalInvestedInAccounts = accounts.reduce((s, a) => s + Number(a.investmentBalance), 0);

        // Calcular média de economia mensal (Income - Expense)
        const monthlySurplus: Record<string, { income: number, expense: number }> = {};

        historyTransactions.forEach(t => {
            const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
            if (!monthlySurplus[key]) monthlySurplus[key] = { income: 0, expense: 0 };

            if (t.type === 'INCOME') monthlySurplus[key].income += Number(t.amount);
            else if (t.type === 'EXPENSE') monthlySurplus[key].expense += Math.abs(Number(t.amount));
        });

        const monthKeys = Object.keys(monthlySurplus);
        const totalSurplus = monthKeys.reduce((s, k) => s + (monthlySurplus[k].income - monthlySurplus[k].expense), 0);
        const averageSaving = monthKeys.length > 0 ? totalSurplus / monthKeys.length : 0;

        return {
            totalSaved: totalSavedInGoals + totalInvestedInAccounts, // Dinheiro parado em metas + investimentos
            averageSaving: averageSaving > 0 ? averageSaving : 0,
        };
    } catch (error) {
        console.error("[Goal Stats] Error:", error);
        return { totalSaved: 0, averageSaving: 0 };
    }
}

export async function generateSuggestedMilestones(targetAmount: number) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const fs = require('fs');
        const path = require('path');
        const promptTemplate = fs.readFileSync(path.join(process.cwd(), 'src/prompts/goal-milestones.txt'), 'utf8');

        const prompt = promptTemplate.replace('{{targetAmount}}', targetAmount.toString());

        const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const milestones = await ai.json<{ description: string; amount: number }[]>(prompt, { temperature: 0.4 });

        return milestones || [];
    } catch (error) {
        console.error("[Milestone Generation] Error:", error);
        return [];
    }
}
