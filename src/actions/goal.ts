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
    milestones?: { description: string; amount: number }[];
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { milestones, ...goalData } = data;

    const goal = await prisma.goal.create({
        data: {
            ...goalData,
            userId: session.user.id,
            milestones: milestones ? {
                create: milestones
            } : undefined
        },
        include: { milestones: true }
    });

    revalidatePath("/goals");
    revalidatePath("/");
    return goal;
}

export async function getGoals() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const goals = await prisma.goal.findMany({
        where: { userId: session.user.id },
        include: {
            milestones: {
                orderBy: { amount: 'asc' }
            },
            _count: {
                select: { transactions: true }
            }
        },
        orderBy: { createdAt: "desc" },
    });

    return goals.map(g => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        milestones: g.milestones.map(m => ({
            ...m,
            amount: Number(m.amount)
        }))
    }));
}

export async function getGoalDetails(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const goal = await prisma.goal.findUnique({
        where: { id, userId: session.user.id },
        include: {
            milestones: {
                orderBy: { amount: 'asc' }
            },
            transactions: {
                orderBy: { date: 'desc' },
                take: 10
            }
        }
    });

    if (!goal) return null;

    // Buscar histórico de 6 meses de transações vinculadas a esta meta
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const history = await prisma.transaction.groupBy({
        by: ['date'],
        where: {
            goalId: id,
            date: { gte: sixMonthsAgo }
        },
        _sum: { amount: true }
    });

    return {
        ...goal,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        milestones: goal.milestones.map(m => ({
            ...m,
            amount: Number(m.amount)
        })),
        transactions: goal.transactions.map(t => ({
            ...t,
            amount: Number(t.amount)
        })),
        history: history.map(h => ({
            ...h,
            _sum: { amount: h._sum.amount ? Number(h._sum.amount) : 0 }
        }))
    };
}

export async function updateGoal(id: string, data: any) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { milestones, ...goalData } = data;

    // Se houver milestones, vamos deletar as antigas e criar as novas (simplificação)
    if (milestones) {
        await prisma.goalMilestone.deleteMany({ where: { goalId: id } });
    }

    const goal = await prisma.goal.update({
        where: { id, userId: session.user.id },
        data: {
            ...goalData,
            milestones: milestones ? {
                create: milestones
            } : undefined
        },
    });

    revalidatePath("/goals");
    revalidatePath(`/goals/${id}`);
    revalidatePath("/");
    return goal;
}

export async function toggleMilestone(id: string, isCompleted: boolean) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const milestone = await prisma.goalMilestone.update({
        where: { id },
        data: { isCompleted }
    });

    revalidatePath("/goals");
    revalidatePath(`/goals/${milestone.goalId}`);
    return milestone;
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
