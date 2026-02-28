"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function createGoal(data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: Date | null;
    color?: string;
    icon?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const goal = await prisma.goal.create({
        data: {
            ...data,
            userId: session.user.id,
        },
    });

    revalidatePath("/goals");
    revalidatePath("/");
    return goal;
}

export async function getGoals() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    return prisma.goal.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });
}

export async function updateGoal(id: string, data: any) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const goal = await prisma.goal.update({
        where: { id, userId: session.user.id },
        data,
    });

    revalidatePath("/goals");
    revalidatePath("/");
    return goal;
}

export async function deleteGoal(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.goal.delete({
        where: { id, userId: session.user.id },
    });

    revalidatePath("/goals");
    revalidatePath("/");
}
