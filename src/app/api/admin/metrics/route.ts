import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !(session.user as any).isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Total active users (with active subscription or any user)
        const totalUsers = await prisma.user.count({
            where: { isAdmin: false },
        });

        const activeUsers = await prisma.user.count({
            where: {
                isAdmin: false,
                stripeCurrentPeriodEnd: { gte: new Date() },
            },
        });

        // All users with subscription info for calculations
        const subscribedUsers = await prisma.user.findMany({
            where: {
                isAdmin: false,
                stripePriceId: { not: null },
            },
            select: {
                stripePriceId: true,
                stripeCurrentPeriodEnd: true,
            },
        });

        // Plan prices mapping
        const planPrices: Record<string, number> = {
            [process.env.NEXT_PUBLIC_STRIPE_PRO_MENSAL_ID!]: 39.99,
            [process.env.NEXT_PUBLIC_STRIPE_PRO_ANUAL_ID!]: 31.99,
            [process.env.NEXT_PUBLIC_STRIPE_PRIME_MENSAL_ID!]: 69.99,
            [process.env.NEXT_PUBLIC_STRIPE_PRIME_ANUAL_ID!]: 55.99,
            [process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_MENSAL_ID!]: 89.99,
            [process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_ANUAL_ID!]: 71.99,
        };

        // MRR = sum of active subscription values
        const now = new Date();
        let mrr = 0;
        let expiredCount = 0;

        subscribedUsers.forEach(user => {
            const price = planPrices[user.stripePriceId || ""] || 0;
            if (user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd >= now) {
                mrr += price;
            } else if (user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd < now) {
                expiredCount++;
            }
        });

        // Churn Rate = expired / total subscribed * 100
        const totalSubscribed = subscribedUsers.length;
        const churnRate = totalSubscribed > 0
            ? parseFloat(((expiredCount / totalSubscribed) * 100).toFixed(1))
            : 0;

        // 12-month projection: MRR * 12 (simplified)
        // A more sophisticated version would account for expected churn
        const projection12Months = mrr * 12;

        // Monthly projection breakdown for chart
        const monthlyProjection = Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
            // Simple model: slight growth factor each month
            const projectedMrr = mrr * (1 + (i * 0.02)); // 2% growth assumption per month
            return {
                month: monthName,
                value: parseFloat(projectedMrr.toFixed(2)),
            };
        });

        return NextResponse.json({
            totalUsers,
            activeUsers,
            mrr,
            churnRate,
            projection12Months,
            monthlyProjection,
        });
    } catch (error) {
        console.error("[ADMIN_METRICS]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
