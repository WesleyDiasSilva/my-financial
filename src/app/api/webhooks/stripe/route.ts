import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { prisma as db } from "@/lib/prisma";

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        // Pegar a subscription
        const subscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
        )) as Stripe.Subscription;

        if (!session?.metadata?.userId) {
            return new NextResponse("User ID is required in metadata", {
                status: 400,
            });
        }

        // Atualizar o banco de dados do user vinculado à assinatura
        await db.user.update({
            where: {
                id: session.metadata.userId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                    (subscription as any).current_period_end * 1000
                ),
            },
        });
    }

    if (event.type === "invoice.payment_succeeded") {
        // Quando uma inscrição é renovada com sucesso
        const subscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
        )) as Stripe.Subscription;

        await db.user.update({
            where: {
                stripeSubscriptionId: subscription.id,
            },
            data: {
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                    (subscription as any).current_period_end * 1000
                ),
            },
        });
    }

    return new NextResponse(null, { status: 200 });
}
