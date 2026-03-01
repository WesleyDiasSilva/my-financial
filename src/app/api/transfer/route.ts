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

        const { sourceAccountId, destinationAccountId, amount, date, isPaid } = await req.json();

        if (!sourceAccountId || !destinationAccountId || !amount || !date) {
            return NextResponse.json({ message: "Campos obrigatórios faltando." }, { status: 400 });
        }

        if (sourceAccountId === destinationAccountId) {
            return NextResponse.json({ message: "Conta de origem e destino devem ser diferentes." }, { status: 400 });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({ message: "Valor inválido." }, { status: 400 });
        }

        // Verify both accounts belong to the user
        const [sourceAccount, destAccount] = await Promise.all([
            prisma.account.findFirst({ where: { id: sourceAccountId, userId: session.user.id } }),
            prisma.account.findFirst({ where: { id: destinationAccountId, userId: session.user.id } }),
        ]);

        if (!sourceAccount || !destAccount) {
            return NextResponse.json({ message: "Conta não encontrada." }, { status: 404 });
        }

        // Find or create a "Transferência" category
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

        const txDate = new Date(date);

        // Atomic transaction
        await prisma.$transaction(async (tx) => {
            // Debit from source
            await tx.transaction.create({
                data: {
                    description: `Transferência para ${destAccount.name}`,
                    amount: parsedAmount,
                    date: txDate,
                    type: "TRANSFER",
                    isPaid,
                    userId: session.user.id,
                    categoryId: transferCategory!.id,
                    accountId: sourceAccountId,
                },
            });

            // Credit to destination
            await tx.transaction.create({
                data: {
                    description: `Transferência de ${sourceAccount.name}`,
                    amount: parsedAmount,
                    date: txDate,
                    type: "TRANSFER",
                    isPaid,
                    userId: session.user.id,
                    categoryId: transferCategory!.id,
                    accountId: destinationAccountId,
                },
            });

            // Update balances if paid
            if (isPaid) {
                await tx.account.update({
                    where: { id: sourceAccountId },
                    data: { balance: { decrement: parsedAmount } },
                });

                await tx.account.update({
                    where: { id: destinationAccountId },
                    data: { balance: { increment: parsedAmount } },
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TRANSFER]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
