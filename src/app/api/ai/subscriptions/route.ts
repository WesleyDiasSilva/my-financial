import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeminiProvider } from "@/lib/ai/providers/gemini";

interface DetectedSubscription {
    name: string;
    category: string;
    amount: number;
    icon: string;
    iconColor: string;
    iconBg: string;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                type: "EXPENSE",
                date: { gte: threeMonthsAgo },
            },
            include: { category: true },
            orderBy: { date: "desc" },
        });

        // Agrupar por descrição e encontrar padrões
        const grouped: Record<string, { description: string; amounts: number[]; dates: Date[]; category: string }> = {};
        transactions.forEach(t => {
            const key = t.description.toLowerCase().trim();
            if (!grouped[key]) {
                grouped[key] = {
                    description: t.description,
                    amounts: [],
                    dates: [],
                    category: t.category?.name || "Outros",
                };
            }
            grouped[key].amounts.push(Math.abs(Number(t.amount)));
            grouped[key].dates.push(new Date(t.date));
        });

        // Filtrar potenciais assinaturas: pelo menos 2 ocorrências com valor similar
        const candidates = Object.values(grouped).filter(g => {
            if (g.amounts.length < 2) return false;
            const avg = g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length;
            const allSimilar = g.amounts.every(a => Math.abs(a - avg) / avg < 0.15);
            return allSimilar;
        });

        if (candidates.length === 0) {
            return NextResponse.json({ subscriptions: [], totalMonthly: 0 });
        }

        const candidatesStr = candidates.map(c =>
            `- "${c.description}" | Categoria: ${c.category} | Valor médio: R$ ${(c.amounts.reduce((a, b) => a + b, 0) / c.amounts.length).toFixed(2)} | ${c.amounts.length} ocorrências em 3 meses`
        ).join("\n");

        const prompt = `Analise estas transações recorrentes e identifique quais são assinaturas/serviços fixos (streaming, academia, apps, cloud, etc).

${candidatesStr}

Responda APENAS com JSON array, sem markdown:
[
  {
    "name": "Nome amigável da assinatura",
    "category": "Categoria curta (Entretenimento, Música, Armazenamento, Fitness, Transporte, Software, etc)",
    "amount": <valor mensal como número>,
    "icon": "<nome do ícone lucide: play, music, cloud, dumbbell, car, code, etc>",
    "iconColor": "<cor CSS: text-red-500, text-green-500, text-blue-500, text-purple-500, text-orange-500>",
    "iconBg": "<cor bg CSS: bg-red-500/20, bg-green-500/20, bg-blue-500/20, etc>"
  }
]

Se nenhuma for assinatura, retorne []. Máximo 5 itens.`;

        const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const subscriptions = await ai.json<DetectedSubscription[]>(prompt, {
            temperature: 0.3,
            maxTokens: 512,
        });

        const subs = Array.isArray(subscriptions) ? subscriptions : [];
        const totalMonthly = subs.reduce((acc, s) => acc + s.amount, 0);

        return NextResponse.json({ subscriptions: subs, totalMonthly });
    } catch (error) {
        console.error("[AI Subscriptions] Error:", error);
        return NextResponse.json({ subscriptions: [], totalMonthly: 0 });
    }
}
