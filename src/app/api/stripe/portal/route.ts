import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma as db } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: session.user.email },
            select: { stripeCustomerId: true },
        });

        if (!user || !user.stripeCustomerId) {
            return new NextResponse("Not a subscriber", { status: 400 });
        }

        // Criar a URL de fallback
        const url = new URL(req.url);
        const billingUrl = `${url.origin}/billing`;

        const stripeSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: billingUrl,
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        console.error("[STRIPE_PORTAL]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
