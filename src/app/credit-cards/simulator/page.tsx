import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SimulatorClient } from "./simulator-client";

export const dynamic = 'force-dynamic'

export default async function SimulatorPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const [cards, categories, accounts] = await Promise.all([
        prisma.creditCard.findMany({
            where: { account: { userId: session.user.id } },
            include: {
                account: true,
                transactions: {
                    orderBy: { date: 'desc' }
                }
            },
            orderBy: { createdAt: 'asc' }
        }),
        prisma.category.findMany({
            where: { userId: session.user.id },
            orderBy: { name: 'asc' }
        }),
        prisma.account.findMany({
            where: { userId: session.user.id },
            orderBy: { name: 'asc' }
        })
    ]);

    // Format Decimal objects to numbers for client parsing
    const serializedCards = cards.map(c => ({
        ...c,
        limit: Number(c.limit),
        goal: c.goal ? Number(c.goal) : null,
        account: c.account ? {
            ...c.account,
            balance: Number(c.account.balance),
            investmentBalance: Number(c.account.investmentBalance)
        } : null,
        transactions: c.transactions.map(t => ({
            ...t,
            amount: Number(t.amount)
        }))
    }));

    const serializedCategories = categories.map(c => ({
        ...c,
        monthlyLimit: c.monthlyLimit ? Number(c.monthlyLimit) : null,
        limit: c.monthlyLimit ? Number(c.monthlyLimit) : null
    }));

    const serializedAccounts = accounts.map(a => ({
        ...a,
        balance: Number(a.balance),
        investmentBalance: Number(a.investmentBalance)
    }));

    return (
        <SimulatorClient
            initialCards={serializedCards}
            categories={serializedCategories}
            accounts={serializedAccounts}
        />
    );
}
