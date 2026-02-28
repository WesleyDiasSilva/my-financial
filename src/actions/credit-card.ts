"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCreditCard(data: { name: string; limit: number; closingDay: number; dueDay: number; color: string; accountId: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    if (!data.accountId) throw new Error("Um cartão de crédito precisa estar vinculado a uma conta corrente");

    const card = await prisma.creditCard.create({
        data: {
            ...data,
            userId: session.user.id,
        },
    });

    revalidatePath("/credit-cards");
    revalidatePath("/transactions");
    return {
        ...card,
        limit: Number(card.limit)
    };
}

export async function getCreditCards() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const cards = await prisma.creditCard.findMany({
        where: { userId: session.user.id },
        include: {
            transactions: true,
            account: true
        },
        orderBy: { sortOrder: "asc" } as any,
    });

    return cards.map((c: any) => ({
        ...c,
        limit: Number(c.limit),
        account: c.account ? {
            ...c.account,
            balance: Number(c.account.balance),
            investmentBalance: Number(c.account.investmentBalance)
        } : null,
        transactions: (c as any).transactions?.map((t: any) => ({
            ...t,
            amount: Number(t.amount)
        })) || []
    }));
}

export async function deleteCreditCard(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const existing = await prisma.creditCard.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    try {
        await prisma.creditCard.delete({
            where: { id },
        });
    } catch (error: any) {
        if (error.code === 'P2003') {
            throw new Error("Não é possível excluir este cartão pois há transações vinculadas a ele.");
        }
        throw new Error("Ocorreu um erro ao excluir o cartão.");
    }

    revalidatePath("/credit-cards");
    revalidatePath("/transactions");
}

export async function updateCreditCard(id: string, data: { name: string; limit: number; closingDay: number; dueDay: number; color: string; accountId: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    if (!data.accountId) throw new Error("Um cartão de crédito precisa estar vinculado a uma conta corrente");

    const existing = await prisma.creditCard.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    const card = await prisma.creditCard.update({
        where: { id },
        data: {
            name: data.name,
            limit: data.limit,
            closingDay: data.closingDay,
            dueDay: data.dueDay,
            color: data.color,
            accountId: data.accountId,
        },
    });

    revalidatePath("/credit-cards");
    revalidatePath("/transactions");
    return {
        ...card,
        limit: Number(card.limit)
    };
}

export async function reorderCreditCards(ids: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.$transaction(
        ids.map((id, index) =>
            prisma.creditCard.update({
                where: { id, userId: session.user.id },
                data: { sortOrder: index } as any,
            })
        )
    );

    revalidatePath("/credit-cards");
}
export async function getCreditCardById(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const card = await prisma.creditCard.findFirst({
        where: { id, userId: session.user.id },
        include: {
            transactions: {
                orderBy: { date: "desc" },
                include: { category: true }
            },
            account: true
        }
    });

    if (!card) return null;

    return {
        ...card,
        limit: Number(card.limit),
        account: card.account ? {
            ...card.account,
            balance: Number(card.account.balance),
            investmentBalance: Number(card.account.investmentBalance)
        } : null,
        transactions: card.transactions.map((t: any) => ({
            ...t,
            amount: Number(t.amount)
        }))
    };
}
