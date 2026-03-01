import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { accountId, amount, operation } = body;
        const goalId = body.goalId || undefined; // Sanitize: empty string -> undefined

        if (!accountId || !amount || !operation) {
            return NextResponse.json({ message: "Campos obrigatórios faltando." }, { status: 400 });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({ message: "Valor inválido." }, { status: 400 });
        }

        if (operation !== "apply" && operation !== "withdraw") {
            return NextResponse.json({ message: "Operação inválida." }, { status: 400 });
        }

        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: session.user.id },
        });

        if (!account) {
            return NextResponse.json({ message: "Conta não encontrada." }, { status: 404 });
        }

        // Validate goal if provided (only for apply operation)
        if (goalId && operation === "apply") {
            const goal = await prisma.goal.findFirst({
                where: { id: goalId, userId: session.user.id }
            });
            if (!goal) {
                return NextResponse.json({ message: "Meta não encontrada." }, { status: 404 });
            }
        }

        const balance = Number(account.balance);
        const investmentBalance = Number(account.investmentBalance);

        if (operation === "apply") {
            if (parsedAmount > balance) {
                return NextResponse.json({ message: "Saldo disponível insuficiente para aplicação." }, { status: 400 });
            }
        } else {
            if (parsedAmount > investmentBalance) {
                return NextResponse.json({ message: "Saldo investido insuficiente para resgate." }, { status: 400 });
            }
        }

        // Find or create "Transferência" category
        let transferCategory = await prisma.category.findFirst({
            where: { userId: session.user.id, name: "Transferência" },
        });

        if (!transferCategory) {
            transferCategory = await prisma.category.create({
                data: {
                    name: "Transferência",
                    type: "TRANSFER",
                    color: "#06b6d4",
                    userId: session.user.id,
                },
            });
        }

        const description = operation === "apply"
            ? (goalId ? `Aporte em meta: ${account.name}` : `Aplicação em investimento — ${account.name}`)
            : `Resgate de investimento — ${account.name}`;

        await prisma.$transaction(async (tx) => {
            // Create transaction record for the statement
            await tx.transaction.create({
                data: {
                    description,
                    amount: parsedAmount,
                    date: new Date(),
                    type: "TRANSFER",
                    isPaid: true,
                    userId: session.user.id,
                    categoryId: transferCategory!.id,
                    accountId,
                    goalId: operation === "apply" ? goalId : undefined,
                },
            });

            // Update balances
            if (operation === "apply") {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: { decrement: parsedAmount },
                        investmentBalance: { increment: parsedAmount },
                    },
                });

                // Update goal if provided
                if (goalId) {
                    await tx.goal.update({
                        where: { id: goalId },
                        data: {
                            currentAmount: { increment: parsedAmount }
                        }
                    });
                }
            } else {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: { increment: parsedAmount },
                        investmentBalance: { decrement: parsedAmount },
                    },
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[INVESTMENT]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
