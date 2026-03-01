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

        // Only return non-sensitive user data
        const users = await prisma.user.findMany({
            where: { isAdmin: false },
            select: {
                id: true,
                name: true,
                email: true,
                stripePriceId: true,
                stripeCurrentPeriodEnd: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        // Map plan names
        const planNames: Record<string, string> = {
            "price_free": "Free",
            "price_1RGJFqP8GrvSfETjYS461xDI": "Basic",
            "price_1RGJGaP8GrvSfETjnI3tFhpB": "Premium",
        };

        const mappedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            plan: planNames[user.stripePriceId || ""] || "Free",
            status: user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd >= new Date()
                ? "active"
                : user.stripePriceId ? "expired" : "free",
            createdAt: user.createdAt,
        }));

        return NextResponse.json(mappedUsers);
    } catch (error) {
        console.error("[ADMIN_USERS]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
