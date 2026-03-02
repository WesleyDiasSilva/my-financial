import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    console.log(`[STRIPE_WEBHOOK] Event received: ${event.type}`);

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
        )) as any;

        if (!session?.metadata?.userId) {
            console.error("[STRIPE_WEBHOOK] Missing userId in session metadata");
            return new NextResponse("User id is required", { status: 400 });
        }

        await prisma.user.update({
            where: {
                id: session.metadata.userId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                    subscription.current_period_end * 1000
                ),
            },
        });
        console.log(`[STRIPE_WEBHOOK] 🟢 Subscription created for user: ${session.metadata.userId}`);
    }

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as any;

        if (invoice.subscription) {
            const subscription = (await stripe.subscriptions.retrieve(
                invoice.subscription as string
            )) as any;

            await prisma.user.update({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    stripePriceId: subscription.items.data[0].price.id,
                    stripeCurrentPeriodEnd: new Date(
                        subscription.current_period_end * 1000
                    ),
                },
            });
            console.log(`[STRIPE_WEBHOOK] 🟢 Subscription updated for subscription: ${subscription.id}`);
        }
    }

    return new NextResponse(null, { status: 200 });
}
