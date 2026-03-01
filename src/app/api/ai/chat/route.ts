import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import type { AIMessage } from "@/lib/ai/contracts/ai-provider";
import { buildChatPrompt } from "@/lib/ai/prompts/chat";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Mensagens obrigatórias" }, { status: 400 });
        }

        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);

        const [user, transactions, accounts, creditCards, goals, categories] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { name: true, monthlyIncome: true } }),
            prisma.transaction.findMany({
                where: { userId, date: { gte: threeMonthsAgo } },
                include: { category: true },
                orderBy: { date: "desc" },
                take: 100,
            }),
            prisma.account.findMany({ where: { userId } }),
            prisma.creditCard.findMany({
                where: { userId },
                include: { transactions: { where: { date: { gte: threeMonthsAgo } }, take: 30 } },
            }),
            prisma.goal.findMany({ where: { userId } }),
            prisma.category.findMany({ where: { userId } }),
        ]);

        const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
        const totalInvestments = accounts.reduce((acc, a) => acc + Number(a.investmentBalance), 0);

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const monthlyTxs = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const income = monthlyTxs.filter(t => t.type === "INCOME").reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const expense = monthlyTxs.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

        const categorySpending = monthlyTxs
            .filter(t => t.type === "EXPENSE")
            .reduce((acc: Record<string, number>, t) => {
                const cat = t.category?.name || "Outros";
                acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.amount));
                return acc;
            }, {});

        const totalCreditDebt = creditCards.reduce((acc, c) =>
            acc + (c.transactions || []).reduce((s: number, tx: any) => s + Math.abs(Number(tx.amount)), 0), 0);

        // Get future and recurring transactions for prediction
        const recurring = transactions.filter(t => t.isRecurring);
        const pendingFuture = transactions.filter(t => !t.isPaid && new Date(t.date) >= today);

        const systemPrompt = buildChatPrompt({
            user,
            today,
            totalBalance,
            totalInvestments,
            income,
            expense,
            totalCreditDebt,
            categorySpending,
            categories,
            goals,
            creditCards,
            pendingFuture,
            recurring,
            transactions,
            accounts,
        });

        // Gemini requires the first message in history to be from 'user'
        let filteredMessages: any[] = messages;
        if (messages.length > 0 && messages[0].role === "assistant") {
            filteredMessages = messages.slice(1);
        }

        // Defensive mapping and filtering
        const processedMessages = filteredMessages
            .filter((m: any) => m.role === "user" || m.role === "assistant")
            .map((m: any) => ({
                role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
                content: m.content || "..."
            }));

        console.log("[AI Chat] Sending messages count:", processedMessages.length);

        const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const response = await ai.chat(processedMessages, {
            temperature: 0.7,
            systemPrompt: systemPrompt
        });

        return NextResponse.json({ content: response.content });
    } catch (error: any) {
        console.error("[AI Chat] CRITICAL ERROR:", error.message, error.stack);
        return NextResponse.json(
            { error: error.message || "Erro interno no servidor" },
            { status: 500 }
        );
    }
}
