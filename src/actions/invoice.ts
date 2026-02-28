"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth } from "date-fns";

export async function payCreditCardInvoice(cardId: string, month: number, year: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const userId = session.user.id;

    // 1. Fetch card and ensure it has an account
    const card = await prisma.creditCard.findUnique({
        where: { id: cardId }
    });

    if (!card || card.userId !== userId) {
        throw new Error("Cartão não encontrado");
    }

    if (!card.accountId) {
        throw new Error("Este cartão não possui uma conta vinculada para realizar o pagamento.");
    }

    // 2. Fetch all unpaid transactions for this card in the specific billing cycle
    // We assume the statement month means: transactions whose 'date' falls into that month/year 
    // OR transactions that belong to this invoice cycle based on closingDay. 
    // Usually, the statement groups them by date if the UI does it that way. 
    // Let's filter by Month and Year of the transaction date as displayed in the UI.
    const startDate = startOfMonth(new Date(year, month));
    const endDate = endOfMonth(new Date(year, month));

    const unpaidTransactions = await prisma.transaction.findMany({
        where: {
            creditCardId: cardId,
            userId: userId,
            isPaid: false,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    if (unpaidTransactions.length === 0) {
        throw new Error("Não há transações pendentes para esta fatura.");
    }

    // 3. Calculate total amount
    const totalAmount = unpaidTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

    // 4. Ensure System Category exists
    const systemCategoryId = `system-invoice-${userId}`;
    let systemCategory = await prisma.category.findUnique({
        where: { id: systemCategoryId }
    });

    if (!systemCategory) {
        systemCategory = await prisma.category.create({
            data: {
                id: systemCategoryId,
                name: "Pagamento de Fatura",
                type: "EXPENSE",
                color: "#ef4444", // Redish
                isRequired: true,
                isFixed: true,
                userId: userId
            }
        });
    }

    // 5. Create Expense Transaction on the linked Account and Update Card Transactions
    await prisma.$transaction(async (tx) => {
        // Debitar da Conta Corrente (Criar transação de Despesa)
        await tx.transaction.create({
            data: {
                description: `Pagamento Fatura ${card.name} (${month + 1}/${year})`,
                amount: totalAmount,
                type: "EXPENSE",
                date: new Date(), // Data do pagamento (hoje)
                isPaid: true,
                accountId: card.accountId,
                categoryId: systemCategory.id,
                userId: userId,
            }
        });

        // Abater o balanço da Conta
        await tx.account.update({
            where: { id: card.accountId! },
            data: {
                balance: { decrement: totalAmount }
            }
        });

        // Marcar todas as transações da fatura como pagas
        const transactionIds = unpaidTransactions.map((t) => t.id);
        await tx.transaction.updateMany({
            where: {
                id: { in: transactionIds }
            },
            data: {
                isPaid: true
            }
        });
    });

    revalidatePath("/credit-cards");
    revalidatePath(`/credit-cards/${cardId}/statement`);
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/accounts");
}
