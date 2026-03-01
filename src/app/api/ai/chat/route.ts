import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import type { AIMessage } from "@/lib/ai/contracts/ai-provider";

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

        const systemPrompt = `Você é o assistente financeiro pessoal IA do MyLife. Seu nome é MyLife AI.

## Sua Personalidade
- Empático, super direto e prático
- SEJA EXTREMAMENTE CONCISO. Evite introduções longas ou parágrafos imensos. Vá direto ao ponto.
- Responda de forma scaneável: Use listas com marcadores (* ou -) sempre que listar categorias ou dados.
- Use **negrito** apenas para destacar os valores (ex: **R$ 1.000,00**) ou palavras chaves muito importantes.
- Use emojis com moderação para tornar a conversa agradável.
- Sempre baseie suas respostas nos dados reais do usuário e fale em português brasileiro.

## Contexto Financeiro do Usuário (${user?.name || "Usuário"})
- Data atual: ${today.toLocaleDateString("pt-BR")}
- Renda mensal declarada: ${user?.monthlyIncome ? `R$ ${Number(user.monthlyIncome).toFixed(2)}` : "Não informada"}
- Saldo em contas: R$ ${totalBalance.toFixed(2)}
- Total investido: R$ ${totalInvestments.toFixed(2)}
- Receita este mês: R$ ${income.toFixed(2)}
- Despesa este mês: R$ ${expense.toFixed(2)}
- Resultado: R$ ${(income - expense).toFixed(2)}
- Dívida em cartões: R$ ${totalCreditDebt.toFixed(2)}

## Gastos por Categoria (mês atual)
${Object.entries(categorySpending).map(([k, v]) => `- ${k}: R$ ${v.toFixed(2)}`).join("\n") || "Sem gastos registrados"}

## Limites por Categoria
${categories.filter(c => c.monthlyLimit).map(c => `- ${c.name}: limite R$ ${Number(c.monthlyLimit).toFixed(2)}`).join("\n") || "Sem limites definidos"}

## Metas
${goals.map(g => `- ${g.name}: R$ ${Number(g.currentAmount).toFixed(2)} de R$ ${Number(g.targetAmount).toFixed(2)}`).join("\n") || "Sem metas"}

## Cartões de Crédito
${creditCards.map(c => `- ${c.name}: limite R$ ${Number(c.limit).toFixed(2)}`).join("\n")}

## Contas Previstas (Agendadas/Futuras)
${pendingFuture.length > 0 ? pendingFuture.map(t => `- ${t.description}: ${t.type === "INCOME" ? "+" : "-"}R$ ${Math.abs(Number(t.amount)).toFixed(2)} (Vence: ${new Date(t.date).toLocaleDateString("pt-BR")})`).join("\n") : "Nenhuma conta prevista."}

## Assinaturas / Contas Recorrentes
${recurring.length > 0 ? recurring.map(t => `- ${t.description}: R$ ${Math.abs(Number(t.amount)).toFixed(2)} (A cada ${t.recurrencePeriod} ${t.recurrenceType})`).join("\n") : "Nenhuma recorrência ativa."}

## Últimas 30 Transações (Histórico Recente)
${transactions.slice(0, 30).map(t => `- ${t.description}: ${t.type === "INCOME" ? "+" : "-"}R$ ${Math.abs(Number(t.amount)).toFixed(2)} (${t.category?.name || "Sem cat"}, ${new Date(t.date).toLocaleDateString("pt-BR")}) - ${t.isPaid ? 'Efetuada' : 'Pendente'}`).join("\n")}

## Suas Capacidades
- Analisar situação financeira atual
- Ajudar a decidir se deve fazer uma compra
- Sugerir estratégias de economia
- Orientar sobre investimentos
- Ajudar com planejamento financeiro
- Alertar sobre riscos

IMPORTANTE: Sempre baseie suas respostas nos dados reais acima. Nunca invente dados. Se não tiver informação suficiente, peça ao usuário.`;

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
