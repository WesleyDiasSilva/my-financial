"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMonthlyIncome() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return 0;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    }) as any;

    return Number(user?.monthlyIncome || 0);
}

export async function updateMonthlyIncome(amount: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Não autorizado");

    await prisma.user.update({
        where: { email: session.user.email },
        data: { monthlyIncome: amount } as any
    });

    revalidatePath("/planning");
    revalidatePath("/");
}
