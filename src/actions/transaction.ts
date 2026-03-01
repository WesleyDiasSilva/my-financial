"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTransaction(data: {
    description: string;
    amount: number;
    date: Date;
    type: "INCOME" | "EXPENSE";
    categoryId?: string | null;
    accountId?: string | null;
    creditCardId?: string | null;
    isPaid?: boolean;
    isRecurring?: boolean;
    recurrenceType?: "WEEKLY" | "MONTHLY" | "YEARLY" | null;
    recurrencePeriod?: number | null;
    installments?: number;
    isReimbursable?: boolean;
    reimbursementDate?: Date | null;
    goalId?: string | null;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const { installments = 1, isReimbursable, reimbursementDate, ...txData } = data;

    if (txData.creditCardId) {
        const card = await prisma.creditCard.findUnique({
            where: { id: txData.creditCardId },
            include: { transactions: true }
        });

        if (!card) throw new Error("Cartão não encontrado");

        const unpaidDebt = card.transactions
            .filter(t => !t.isPaid)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const availableLimit = Number(card.limit) - unpaidDebt;

        if (txData.amount > availableLimit) {
            throw new Error(`Limite insuficiente. Disponível: ${availableLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        }
    }

    const cleanData: any = { ...txData };
    if (!cleanData.categoryId) delete cleanData.categoryId;
    if (!cleanData.accountId) delete cleanData.accountId;
    if (!cleanData.creditCardId) delete cleanData.creditCardId;
    if (!cleanData.recurrenceType) delete cleanData.recurrenceType;
    if (!cleanData.recurrencePeriod) delete cleanData.recurrencePeriod;
    if (!cleanData.goalId) delete cleanData.goalId;

    if (installments > 1 && txData.creditCardId) {
        const transactions = [];
        const baseDate = new Date(txData.date);

        for (let i = 0; i < installments; i++) {
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(baseDate.getMonth() + i);

            transactions.push({
                ...cleanData,
                description: `${txData.description} (${i + 1}/${installments})`,
                amount: Number((txData.amount / installments).toFixed(2)),
                date: installmentDate,
                isPaid: false, // Installments are non-paid by default
                userId: session.user.id,
            });
        }

        await prisma.transaction.createMany({
            data: transactions
        });
    } else {
        // Normal Creation Logic + Reimbursement Check
        const mainTransaction = await prisma.transaction.create({
            data: {
                ...cleanData,
                isPaid: txData.isPaid ?? true,
                userId: session.user.id,
            }
        });

        if (isReimbursable && reimbursementDate) {
            // Find or configure "Reembolsos" automatic category
            let refundCategory = await prisma.category.findFirst({
                where: { userId: session.user.id, name: "Reembolsos", type: "INCOME" }
            });

            if (!refundCategory) {
                refundCategory = await prisma.category.create({
                    data: {
                        id: `system-refund-${Date.now()}`,
                        name: "Reembolsos",
                        type: "INCOME",
                        color: "#eab308", // Yellow color
                        userId: session.user.id,
                    }
                });
            }

            // Create pending income side on the Bank Account (even if expense originated in Credit Card)
            // If the user selected a credit card but no specific account, we fallback to the card's linked account
            let targetAccountId = txData.accountId;

            if (!targetAccountId && txData.creditCardId) {
                const cardRef = await prisma.creditCard.findUnique({
                    where: { id: txData.creditCardId },
                    select: { accountId: true }
                });
                targetAccountId = cardRef?.accountId || null;
            }

            await prisma.transaction.create({
                data: {
                    description: `Reembolso: ${txData.description}`,
                    amount: txData.amount,
                    type: "INCOME",
                    date: new Date(reimbursementDate),
                    categoryId: refundCategory.id,
                    accountId: targetAccountId,
                    creditCardId: null, // Refunds enter directly into the bank balance, not as CC limit
                    isPaid: false, // Refunds are always born as pending
                    userId: session.user.id,
                }
            });
        }
    }

    revalidatePath("/", "layout");
    return { success: true };
}

export async function getTransactions() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const txs = await prisma.transaction.findMany({
        where: {
            userId: session.user.id,
            creditCardId: null // Only account transactions (Cash/Pix)
        },
        include: {
            category: true,
            account: true,
            creditCard: true,
        },
        orderBy: { date: "desc" },
    });

    return txs.map(t => ({
        ...t,
        amount: Number(t.amount),
        account: t.account ? {
            ...t.account,
            balance: Number(t.account.balance),
            investmentBalance: Number(t.account.investmentBalance)
        } : null,
        creditCard: t.creditCard ? { ...t.creditCard, limit: Number(t.creditCard.limit) } : null,
        category: t.category ? { ...t.category, monthlyLimit: t.category.monthlyLimit ? Number(t.category.monthlyLimit) : null } : null
    }));
}

export async function deleteTransaction(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.transaction.deleteMany({
        where: { id, userId: session.user.id },
    });

    revalidatePath("/", "layout");
}

export async function deleteTransactions(ids: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.transaction.deleteMany({
        where: {
            id: { in: ids },
            userId: session.user.id
        },
    });

    revalidatePath("/", "layout");
}

export async function createTransactionsBatch(items: {
    description: string;
    amount: number;
    date: Date;
    type: "INCOME" | "EXPENSE";
    categoryId?: string | null;
    accountId?: string | null;
    creditCardId?: string | null;
    isPaid?: boolean;
}[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const data = items.map(item => {
        const record: any = {
            description: item.description,
            amount: item.amount,
            date: item.date,
            type: item.type,
            isPaid: item.isPaid ?? true,
            userId: session.user.id,
        };
        if (item.categoryId && item.categoryId !== "null" && isUUID(item.categoryId)) record.categoryId = item.categoryId;
        if (item.accountId && item.accountId !== "null" && isUUID(item.accountId)) record.accountId = item.accountId;
        if (item.creditCardId && item.creditCardId !== "null" && isUUID(item.creditCardId)) record.creditCardId = item.creditCardId;
        return record;
    });

    await prisma.transaction.createMany({ data });

    revalidatePath("/", "layout");
}

export async function updateTransaction(id: string, data: {
    description: string;
    amount: number;
    date: Date;
    type: "INCOME" | "EXPENSE";
    categoryId?: string | null;
    accountId?: string | null;
    creditCardId?: string | null;
    isPaid?: boolean;
    isRecurring?: boolean;
    recurrenceType?: "WEEKLY" | "MONTHLY" | "YEARLY" | null;
    recurrencePeriod?: number | null;
    installments?: number;
    isReimbursable?: boolean;
    reimbursementDate?: Date | null;
    goalId?: string | null;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const { installments, isReimbursable, reimbursementDate, ...txData } = data;

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    if (txData.creditCardId) {
        const card = await prisma.creditCard.findUnique({
            where: { id: txData.creditCardId },
            include: { transactions: true }
        });

        if (!card) throw new Error("Cartão não encontrado");

        const unpaidDebt = card.transactions
            .filter(t => !t.isPaid && t.id !== id)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const availableLimit = Number(card.limit) - unpaidDebt;

        if (txData.amount > availableLimit) {
            throw new Error(`Limite insuficiente. Disponível: ${availableLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        }
    }

    const { categoryId, accountId, creditCardId, ...safeData } = txData;

    const updatePayload: any = {
        ...safeData,
        isPaid: txData.isPaid ?? true,
        isAiCategorized: false, // Ao atualizar/editar, a IA perde a autoria
    };

    if (categoryId) updatePayload.categoryId = categoryId;
    else updatePayload.categoryId = null;

    if (accountId) updatePayload.accountId = accountId;
    else updatePayload.accountId = null;

    if (creditCardId) updatePayload.creditCardId = creditCardId;
    else updatePayload.creditCardId = null;

    if (txData.goalId) updatePayload.goalId = txData.goalId;
    else updatePayload.goalId = null;

    const transaction = await prisma.transaction.update({
        where: { id },
        data: updatePayload,
    });

    revalidatePath("/", "layout");
    return {
        ...transaction,
        amount: Number(transaction.amount)
    };
}

export async function toggleTransactionPaid(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    const transaction = await prisma.transaction.update({
        where: { id },
        data: {
            isPaid: !existing.isPaid,
        },
    });

    revalidatePath("/", "layout");

    return {
        ...transaction,
        amount: Number(transaction.amount)
    };
}

export async function deleteAllTransactions() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const result = await prisma.transaction.deleteMany({
        where: { userId: session.user.id },
    });

    revalidatePath("/", "layout");
    return result.count;
}

export async function ignoreDuplicateTransactions(ids: string[]) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Não autorizado");

        await prisma.transaction.updateMany({
            where: {
                id: { in: ids },
                userId: session.user.id
            },
            data: { ignoreDuplicate: true }
        });

        revalidatePath("/", "layout");
    } catch (error) {
        throw new Error("Erro interno ao ignorar duplicadas.");
    }
}
