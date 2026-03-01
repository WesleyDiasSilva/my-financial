import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assume authOptions export exists
import { stripe } from "@/lib/stripe";
import { prisma as db } from "@/lib/prisma";
import { storeSubscriptionPlans } from "@/config/subscriptions";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { priceId } = await req.json();

        if (!priceId) {
            return new NextResponse("Price ID is missing", { status: 400 });
        }

        // Achar o usuário para ver se já tem customer no stripe
        const user = await db.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, stripeCustomerId: true, email: true },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Criar a URL completa baseada no host atual
        const url = new URL(req.url);
        const billingUrl = `${url.origin}/billing`;

        const stripeSession = await stripe.checkout.sessions.create({
            success_url: billingUrl,
            cancel_url: billingUrl,
            payment_method_types: ["card"],
            mode: "subscription",
            billing_address_collection: "auto",
            customer_email: user.stripeCustomerId ? undefined : user.email!,
            customer: user.stripeCustomerId ? user.stripeCustomerId : undefined,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id,
            },
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
