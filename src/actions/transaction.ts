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
    categoryId: string;
    accountId?: string | null;
    creditCardId?: string | null;
    isPaid?: boolean;
    isRecurring?: boolean;
    recurrenceType?: "WEEKLY" | "MONTHLY" | "YEARLY" | null;
    recurrencePeriod?: number | null;
    installments?: number;
    isReimbursable?: boolean;
    reimbursementDate?: Date | null;
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

    if (installments > 1 && txData.creditCardId) {
        const transactions = [];
        const baseDate = new Date(txData.date);

        for (let i = 0; i < installments; i++) {
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(baseDate.getMonth() + i);

            transactions.push({
                ...txData,
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
                ...txData,
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
                        userId: session.user.id
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

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/credit-cards");
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

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    await prisma.transaction.delete({
        where: { id },
    });

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/credit-cards");
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

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/credit-cards");
}

export async function updateTransaction(id: string, data: {
    description: string;
    amount: number;
    date: Date;
    type: "INCOME" | "EXPENSE";
    categoryId: string;
    accountId?: string | null;
    creditCardId?: string | null;
    isPaid?: boolean;
    isRecurring?: boolean;
    recurrenceType?: "WEEKLY" | "MONTHLY" | "YEARLY" | null;
    recurrencePeriod?: number | null;
    installments?: number;
    isReimbursable?: boolean;
    reimbursementDate?: Date | null;
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

    const transaction = await prisma.transaction.update({
        where: { id },
        data: {
            ...safeData,
            isPaid: txData.isPaid ?? true,
            category: { connect: { id: categoryId } },
            account: accountId ? { connect: { id: accountId } } : { disconnect: true },
            creditCard: creditCardId ? { connect: { id: creditCardId } } : { disconnect: true },
        },
    });

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/credit-cards");
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

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/credit-cards");

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

    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/credit-cards");
    return result.count;
}
