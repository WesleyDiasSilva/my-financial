"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import { TransactionType } from "@prisma/client";

// Initializes the AI Provider securely
const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    return new GeminiProvider(apiKey);
};

export async function analyzeDuplicates() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Não autorizado");

        const userId = (session.user as any).id;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

        const recentTransactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: { gte: thirtyDaysAgo },
                ignoreDuplicate: false, // Pula todas as transações que o usuário deu passe-livre
                creditCardId: null // Só analisa transações de conta (mesma base visível na página)
            },
            orderBy: { date: "desc" },
            take: 100,
            select: {
                id: true,
                description: true,
                amount: true,
                date: true,
                type: true,
                accountId: true,
                creditCardId: true,
            }
        });

        if (recentTransactions.length < 2) return [];

        const ai = getAI();
        const prompt = `Você é um analista financeiro de dados detectando transações duplicadas.
Abaixo está o histórico recente de transações. Encontre grupos de transações que pareçam ser a mesma transação lançada mais de uma vez por erro.

REGRAS DE DUPLICIDADE:
1. O valor MENSURADO (amount) é EXATAMENTE IGUAL (0 diferença).
2. Mesma data ou datas com diferença MÁXIMA de até 1 dia.
3. Descrições muito parecidas ou que remetam à mesma coisa.
4. Mesma Conta (accountId).

Se você encontrar um grupo que combine essas características, retorne APENAS um array JSON contendo as chaves (ID) de todas as transações que você classificar como provável duplicata (apenas as cópias, ou todos os IDs envolvidos no grupo duplicado). 
Se não houver duplicatas, retorne exatamente [].

[TRANSAÇÕES]
${JSON.stringify(recentTransactions, null, 2)}`;

        const suspiciousIds = await ai.json<string[]>(prompt, {
            systemPrompt: "Retorne ESTRITAMENTE um array JSON de strings com os IDs. Exemplo: [\"id1\", \"id2\"]. Nada mais.",
            temperature: 0.2
        });

        return Array.isArray(suspiciousIds) ? suspiciousIds : [];
    } catch (error) {
        console.error("[analyzeDuplicates]", error);
        return [];
    }
}

export async function parseNaturalLanguageSearch(query: string, transactionsPayload: any[]) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Não autorizado");

        const ai = getAI();
        const prompt = `Analise a seguinte busca do usuário: "${query}"

Data Atual: ${new Date().toISOString()}

Esta é a lista de transações disponíveis no momento na interface do usuário:
${JSON.stringify(transactionsPayload, null, 2)}

Sua função é atuar como um filtro de pesquisa humanizada e natural.
Você deve olhar para a lista de transações disponíveis e retornar QUAIS DELAS correspondem ao que o usuário está procurando.

REGRAS:
1. Retorne APENAS um JSON estrito contendo o array "matchedIds" e um "title" amigável descrevendo o seu raciocínio (ex: "Despesas do Uber no Último Mês").
2. Se nenhuma transação da lista corresponder à busca, retorne o array vazio.
3. Não invente IDs, retorne EXATAMENTE os IDs fornecidos.

RETORNE NO EXATO FORMATO JSON:
{
  "matchedIds": ["id1", "id2"],
  "title": "título do filtro"
}`;

        const filters = await ai.json<{ matchedIds: string[], title: string }>(prompt, {
            systemPrompt: "Retorne ESTRITAMENTE o JSON exigido formatado.",
            temperature: 0.1
        });

        return filters;
    } catch (error) {
        console.error("[parseNaturalLanguageSearch]", error);
        return null;
    }
}

export async function batchCategorizeTransactions() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Não autorizado");

        const userId = (session.user as any).id;

        // Pegar transações sem categoria (até 50 por vez para não estourar payload do modelo)
        const uncategorized = await prisma.transaction.findMany({
            where: {
                userId,
                categoryId: null as any,
            },
            take: 50,
            select: { id: true, description: true, amount: true, type: true }
        });

        if (uncategorized.length === 0) return { success: true, count: 0 };

        const categories = await prisma.category.findMany({
            where: { userId },
            select: { id: true, name: true, type: true }
        });

        const ai = getAI();
        const prompt = `Categorize as seguintes transações financeiras órfãs atribuindo o 'categoryId' mais adequado e lógico com base na descrição e tipo.

Categorias disponíveis:
${JSON.stringify(categories, null, 2)}

Transações para categorizar:
${JSON.stringify(uncategorized, null, 2)}

Retorne um array JSON com objetos contendo o ID da transação e o categoryId escolhido:
[
  { "id": "transacao_id", "categoryId": "categoria_id_mais_adequada" }
]
Se não houver categoria razoável para a transação, você pode omitir ela do resultado.`;

        const mapped = await ai.json<{ id: string, categoryId: string }[]>(prompt, {
            systemPrompt: "Retorne NADA além do array JSON com os mapeamentos. Evite alocação incorreta de INCOMES em EXPENSES e vice versa.",
            temperature: 0.3
        });

        if (!Array.isArray(mapped) || mapped.length === 0) return { success: true, count: 0 };

        let updateCount = 0;
        const operations = mapped.map(item => {
            if (!item.id || !item.categoryId) return null;
            updateCount++;
            const payload: any = {
                categoryId: item.categoryId,
                isAiCategorized: true
            };
            return prisma.transaction.update({
                where: { id: item.id },
                data: payload
            });
        }).filter(Boolean);

        await prisma.$transaction(operations as any);

        return { success: true, count: updateCount };
    } catch (error) {
        console.error("[batchCategorizeTransactions]", error);
        return { success: false, error: "Erro ao categorizar transações." };
    }
}
