import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";
import { storeSubscriptionPlans } from "@/config/subscriptions";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { planId, billing } = await req.json();

        if (!planId) {
            return new NextResponse("Plan ID is missing", { status: 400 });
        }

        const plan = storeSubscriptionPlans.find((p) => p.id === planId);
        if (!plan) {
            return new NextResponse("Plan not found", { status: 404 });
        }

        // Achar o usuário para não sobrescrever customer ID se ele já tiver
        const user = await db.user.findUnique({
            where: { email: session.user.email },
            select: { stripeCustomerId: true },
        });

        // Generate mock data based on existing rules
        const mockCustomerId = user?.stripeCustomerId || `cus_mock_${Math.random().toString(36).substring(7)}`;
        const mockSubscriptionId = `sub_mock_${Math.random().toString(36).substring(7)}`;

        const currentDate = new Date();
        const endDate = new Date(currentDate);
        if (billing === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Update user
        await db.user.update({
            where: { email: session.user.email },
            data: {
                stripeCustomerId: mockCustomerId,
                stripeSubscriptionId: mockSubscriptionId,
                stripePriceId: billing === "yearly" && plan.stripePriceIdYearly ? plan.stripePriceIdYearly : plan.stripePriceId,
                stripeCurrentPeriodEnd: endDate,
            },
        });

        return NextResponse.json({ success: true, redirectUrl: "/billing" });
    } catch (error) {
        console.error("[MOCK_CHECKOUT]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
