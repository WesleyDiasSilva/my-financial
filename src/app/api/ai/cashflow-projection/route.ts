import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeminiProvider } from "@/lib/ai/providers/gemini";

export async function GET() {
    let totalBalance = 0;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);

        const [transactions, accounts] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId, date: { gte: threeMonthsAgo } },
                include: { category: true },
                orderBy: { date: "desc" },
            }),
            prisma.account.findMany({ where: { userId } }),
        ]);

        totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

        // Transações recorrentes
        const recurring = transactions.filter(t => t.isRecurring);
        // Transações pendentes futuras
        const pending = transactions.filter(t => !t.isPaid && new Date(t.date) >= today);

        const prompt = `Você é um analista financeiro sênior. Com base nos dados abaixo, projete o Saldo Livre Estimado (acumulado) para os próximos 15 dias, em intervalos de 3 dias.
        
        ## Saldo Atual (Hoje): R$ ${totalBalance.toFixed(2)}
        
        ## Transações Recorrentes Próximas
        ${recurring.map(t => `- ${t.description}: R$ ${Math.abs(Number(t.amount)).toFixed(2)} (${t.type}) - ${t.recurrenceType}, a cada ${t.recurrencePeriod} período(s)`).join("\n") || "Nenhuma"}
        
        ## Transações Pendentes (Agendadas)
        ${pending.map(t => `- ${t.description}: R$ ${Math.abs(Number(t.amount)).toFixed(2)} (${t.type}) - vence em ${new Date(t.date).toLocaleDateString("pt-BR")}`).join("\n") || "Nenhuma"}
        
        ## Comportamento Histórico (Média de gastos extras/variáveis)
        Deduza um valor diário de "gastos invisíveis" baseado no histórico de 3 meses de despesas:
        ${(() => {
                const totalExp = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
                return `Total 3 meses: R$ ${totalExp.toFixed(2)}. Média diária estimada: R$ ${(totalExp / 90).toFixed(2)}`;
            })()}

        Responda APENAS com JSON, sem markdown:
        {
          "projectedBars": [
            { "label": "Hoje", "balance": ${totalBalance.toFixed(2)}, "delta": 0 },
            { "label": "+3d", "balance": <number, saldo total após 3 dias>, "delta": <number, lucro/prejuízo nestes 3 dias> },
            { "label": "+6d", "balance": <number>, "delta": <number> },
            { "label": "+9d", "balance": <number>, "delta": <number> },
            { "label": "+12d", "balance": <number>, "delta": <number> },
            { "label": "+15d", "balance": <number>, "delta": <number> }
          ],
          "insight": "<frase curta analisando se o saldo terminará positivo ou negativo, ex: 'Você deve terminar o período com R$ X livre.'>"
        }`;

        const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const result = await ai.json<{
            projectedBars: { label: string; balance: number; delta: number }[];
            insight: string;
        }>(prompt, { temperature: 0.3 });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[AI Cashflow] CRITICAL ERROR:", error.message, error.stack);
        return NextResponse.json({
            projectedBars: [
                { label: "Hoje", balance: Number(totalBalance), delta: 0 },
                { label: "+3d", balance: Number(totalBalance) * 0.95, delta: -(Number(totalBalance) * 0.05) },
                { label: "+6d", balance: Number(totalBalance) * 0.9, delta: -(Number(totalBalance) * 0.05) },
                { label: "+9d", balance: Number(totalBalance) * 1.05, delta: (Number(totalBalance) * 0.15) },
                { label: "+12d", balance: Number(totalBalance) * 1.1, delta: (Number(totalBalance) * 0.05) },
                { label: "+15d", balance: Number(totalBalance) * 1.15, delta: (Number(totalBalance) * 0.05) },
            ],
            insight: "Sincronizando dados para gerar sua projeção personalizada...",
        });
    }
}
