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
        orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
        ],
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

export async function getAccountHealth(accountId: string) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const account = await prisma.account.findUnique({
        where: { id: accountId, userId: session.user.id },
        include: {
            creditCards: true
        }
    });

    if (!account) throw new Error("Conta não encontrada");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    const accountTxs = await prisma.transaction.findMany({
        where: {
            accountId: accountId,
            isPaid: false,
            date: { lte: next30Days, gte: today }
        }
    });

    const ccIds = account.creditCards.map(c => c.id);
    const ccTxs = ccIds.length > 0 ? await prisma.transaction.findMany({
        where: {
            creditCardId: { in: ccIds },
            isPaid: false
        }
    }) : [];

    const ccTxsMapped = ccTxs.map(tx => {
        const card = account.creditCards.find(c => c.id === tx.creditCardId);
        let dueDate = new Date(tx.date);
        dueDate.setDate(card?.dueDay || 10);
        if (dueDate <= tx.date) {
            dueDate.setMonth(dueDate.getMonth() + 1);
        }
        if (dueDate < today) {
            dueDate = new Date(today);
        }
        return {
            ...tx,
            effectiveDate: dueDate
        };
    }).filter(tx => tx.effectiveDate <= next30Days);

    const allPending = [
        ...accountTxs.map(t => ({ amount: Number(t.amount), type: t.type, date: new Date(t.date) })),
        ...ccTxsMapped.map(t => ({ amount: Number(t.amount), type: 'EXPENSE', date: new Date(t.effectiveDate) }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let currentBalance = Number(account.balance);
    let score = 100;
    let runway = 30;
    let minimumBalance = currentBalance;
    let totalExpenses = 0;

    for (let day = 0; day <= 30; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);

        const dayTxs = allPending.filter(t =>
            t.date.getDate() === currentDate.getDate() &&
            t.date.getMonth() === currentDate.getMonth() &&
            t.date.getFullYear() === currentDate.getFullYear()
        );

        for (const tx of dayTxs) {
            if (tx.type === 'INCOME') {
                currentBalance += tx.amount;
            } else {
                currentBalance -= tx.amount;
                totalExpenses += tx.amount;
            }
        }

        if (currentBalance < minimumBalance) {
            minimumBalance = currentBalance;
        }

        if (currentBalance < 0 && runway === 30) {
            runway = day;
        }
    }

    const projectedBalance = currentBalance;

    if (allPending.length === 0 && Number(account.balance) === 0) {
        return { score: 0, status: "Inativa", runway: 0, projectedBalance: 0 };
    }

    if (projectedBalance < 0) {
        score = Math.max(0, 29 - Math.min(29, (Math.abs(projectedBalance) / (totalExpenses || 1)) * 30));
    } else if (minimumBalance < (totalExpenses * 0.2)) {
        const marginInfo = minimumBalance / (totalExpenses || 1);
        score = 30 + Math.floor((marginInfo / 0.2) * 49);
    } else {
        score = 80 + Math.min(20, Math.floor((minimumBalance / (totalExpenses || 1)) * 10));
    }

    let status = "Excelente";
    if (score < 30) status = "Crítico";
    else if (score < 80) status = "Atenção";

    return {
        score: Math.floor(score),
        status,
        runway: runway > 30 ? "> 30" : runway,
        projectedBalance
    };
}

export async function reorderAccounts(ids: string[]) {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Não autorizado");

    // Perform updates in a transaction
    await prisma.$transaction(
        ids.map((id, index) =>
            prisma.account.update({
                where: { id, userId: session.user.id },
                data: { sortOrder: index }
            })
        )
    );

    revalidatePath("/accounts");
}
