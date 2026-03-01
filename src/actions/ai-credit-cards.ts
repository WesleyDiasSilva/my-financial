"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeminiProvider } from "@/lib/ai/providers/gemini";

export interface CardInsight {
    type: "recommendation" | "summary";
    title: string;
    description: string;
    actionLabel?: string;
}

export interface SimulationInsight {
    title: string;
    description: string;
    status: "success" | "warning" | "danger";
    suggestion?: string;
}

export async function getCreditCardInsights() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Não autorizado");

        const userId = (session.user as any).id;
        const today = new Date();

        const [creditCards, goals] = await Promise.all([
            prisma.creditCard.findMany({
                where: { userId },
                include: {
                    transactions: {
                        where: {
                            date: {
                                gte: new Date(today.getFullYear(), today.getMonth(), 1)
                            }
                        }
                    }
                },
            }),
            prisma.goal.findMany({ where: { userId } }),
        ]);

        if (creditCards.length === 0) return { insights: [] };

        const cardsData = creditCards.map(c => {
            const currentInvoice = (c.transactions || []).reduce((s, tx) => s + Math.abs(Number(tx.amount)), 0);
            return {
                id: c.id,
                name: c.name,
                limit: Number(c.limit),
                availableLimit: Number(c.limit) - currentInvoice,
                currentInvoice,
                closingDay: c.closingDay,
                dueDay: c.dueDay,
            };
        });

        const goalsStr = goals.map(g =>
            `- ${g.name}: ${Number(g.currentAmount).toFixed(2)}/${Number(g.targetAmount).toFixed(2)}`
        ).join("\n");

        const prompt = `Você é um analista financeiro especialista em cartões de crédito. Analise os cartões abaixo e as metas do usuário para fornecer 2 insights estratégicos.

## Cartões de Crédito do Usuário
${cardsData.map(c => `- ${c.name}: Limite R$ ${c.limit.toFixed(2)}, Disponível R$ ${c.availableLimit.toFixed(2)}, Fatura Atual R$ ${c.currentInvoice.toFixed(2)}, Fecha dia ${c.closingDay}, Vence dia ${c.dueDay}`).join("\n")}

## Metas do Usuário
${goalsStr || "Nenhuma meta definida"}

## Regras para os Insights
1. O primeiro deve ser uma RECOMENDAÇÃO de uso para compras acima de R$ 500,00 e abaixo de R$ 100,00. Analise qual cartão tem mais limite, qual está mais longe do fechamento (para ganhar prazo) e qual ajuda mais nas metas.
2. O segundo deve ser um RESUMO ou PADRÃO de comportamento/alerta que você notou nos cartões (ex: muitos cartões perto do limite, oportunidade de concentrar gastos, etc).
3. Não mostre totais que o usuário já vê (ex: "Sua fatura total é X"). Foque em estratégia e "o que fazer".

Responda APENAS com um JSON array, sem markdown, sem explicação:
[
  {
    "type": "recommendation",
    "title": "título estratégico (ex: Melhor cartão para compras altas)",
    "description": "Explicação detalhada de qual cartão usar para >R$500 e <R$100 e porquê.",
    "actionLabel": "O que fazer"
  },
  {
    "type": "summary",
    "title": "Análise de Perfil de Crédito",
    "description": "Análise de padrão de comportamento ou alerta de risco/oportunidade.",
    "actionLabel": "Ajustar Estratégia"
  }
]`;

        const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const insights = await ai.json<CardInsight[]>(prompt, {
            temperature: 0.4,
        });

        return { insights: Array.isArray(insights) ? insights : [] };
    } catch (error) {
        console.error("[Credit Card Insights] Error:", error);
        return { insights: [] };
    }
}

export async function getSimulationInsight(data: {
    simulations: any[];
    categories: any[];
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Não autorizado");

        const userId = (session.user as any).id;
        const goals = await prisma.goal.findMany({ where: { userId } });

        const goalsStr = goals.map(g =>
            `- ${g.name}: ${Number(g.currentAmount).toFixed(2)}/${Number(g.targetAmount).toFixed(2)}`
        ).join("\n");

        const prompt = `Você é um mentor financeiro. Analise a SIMULAÇÃO de compra abaixo e dê um feedback estratégico.

## Simulações Atuais
${data.simulations.map(s => `- ${s.name}: R$ ${s.totalAmount.toFixed(2)} em ${s.installments}x (R$ ${(s.totalAmount / s.installments).toFixed(2)}/mês)`).join("\n")}

## Categorias e Limites do Usuário
${data.categories.map(c => `- ${c.name}: Limite R$ ${Number(c.limit).toFixed(2)}, Atualmente gasta R$ ${c.monthlyTotals[2].toFixed(2)}`).join("\n")}

## Metas
${goalsStr || "Sem metas"}

## Objetivo
Analise se essas novas parcelas cabem no orçamento de cada categoria. 
- Se estourar algum mês, sugira mudar o número de parcelas ou adiar a compra.
- Se couber mas ficar muito apertado (>90% do limite), dê um aviso de cautela.
- Se estiver tudo folgado, valide a compra.

Responda APENAS com um JSON objeto, sem markdown:
{
  "title": "Título curto (ex: Compra do iPhone: Cuidado)",
  "description": "Análise detalhada do impacto nos próximos meses.",
  "status": "success" | "warning" | "danger",
  "suggestion": "Sugestão prática (ex: Tente parcelar em 10x em vez de 6x para não estourar Abril)."
}`;

        const ai = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const insight = await ai.json<SimulationInsight>(prompt, {
            temperature: 0.3,
        });

        return insight;
    } catch (error) {
        console.error("[Simulation Insight] Error:", error);
        return null;
    }
}
