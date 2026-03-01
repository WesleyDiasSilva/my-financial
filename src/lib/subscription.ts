import { prisma as db } from "./prisma";

const DAY_IN_MS = 86_400_000;

export async function getUserSubscriptionPlan(userId: string) {
    const user = await db.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            stripeSubscriptionId: true,
            stripeCurrentPeriodEnd: true,
            stripeCustomerId: true,
            stripePriceId: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Verificar se é válido
    const isPro =
        user.stripePriceId &&
        user.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

    return {
        ...user,
        stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.getTime() || 0,
        isPro: !!isPro,
        planId: user.stripePriceId,
    };
}
