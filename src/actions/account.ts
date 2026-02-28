"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getSession() {
    return await getServerSession(authOptions);
}

export async function getAccounts() {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const accounts = await prisma.account.findMany({
        where: { userId: session.user.id },
        orderBy: { name: 'asc' },
    });

    return accounts.map(acc => ({
        ...acc,
        balance: Number(acc.balance),
        investmentBalance: Number(acc.investmentBalance),
    }));
}

export async function createAccount(data: any) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const account = await prisma.account.create({
        data: {
            name: data.name,
            balance: data.balance,
            investmentBalance: data.investmentBalance || 0,
            type: data.type,
            color: data.color || null,
            userId: session.user.id,
        },
    });

    revalidatePath("/accounts");
    return {
        ...account,
        balance: Number(account.balance),
        investmentBalance: Number(account.investmentBalance)
    };
}

export async function updateAccount(id: string, data: any) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    const account = await prisma.account.update({
        where: { id },
        data: {
            name: data.name,
            balance: data.balance,
            investmentBalance: data.investmentBalance,
            type: data.type,
            color: data.color || null,
        },
    });

    revalidatePath("/accounts");
    return {
        ...account,
        balance: Number(account.balance),
        investmentBalance: Number(account.investmentBalance)
    };
}

export async function deleteAccount(id: string) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    try {
        await prisma.account.delete({
            where: { id },
        });
    } catch (error: any) {
        if (error.code === 'P2003') {
            throw new Error("Não é possível excluir esta conta pois existem transações vinculadas a ela.");
        }
        throw new Error("Ocorreu um erro ao excluir a conta.");
    }

    revalidatePath("/accounts");
}
