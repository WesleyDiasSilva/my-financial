import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const settingsUrl = process.env.NEXTAUTH_URL + "/billing";

export async function POST(req: Request) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return new NextResponse("STRIPE_SECRET_KEY is missing in .env", { status: 500 });
        }

        const session = await getServerSession(authOptions);

        if (!session?.user?.id || !session.user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { priceId } = await req.json();

        if (!priceId) {
            return new NextResponse("Price ID is required", { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        let stripeCustomerId = user.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                name: session.user.name || undefined,
                metadata: {
                    userId: session.user.id,
                },
            });

            stripeCustomerId = customer.id;

            await prisma.user.update({
                where: {
                    id: session.user.id,
                },
                data: {
                    stripeCustomerId,
                },
            });
        }

        // --- PREVENIR DUPLICIDADE ---
        // Verificar se já existe uma assinatura ativa para este cliente
        const activeSubscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: "active",
            limit: 1,
        });

        if (activeSubscriptions.data.length > 0) {
            const currentSubscription = activeSubscriptions.data[0];

            // Se já tem assinatura ativa, redireciona para o Billing Portal 
            // Já configurado para mudar para o novo plano
            const portalSession = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: settingsUrl,
                flow_data: {
                    type: "subscription_update_confirm",
                    subscription_update_confirm: {
                        subscription: currentSubscription.id,
                        items: [
                            {
                                id: currentSubscription.items.data[0].id,
                                price: priceId,
                                quantity: 1,
                            },
                        ],
                    },
                },
            });

            return NextResponse.json({ url: portalSession.url });
        }
        // ----------------------------

        let stripeSession;

        try {
            stripeSession = await stripe.checkout.sessions.create({
                customer: stripeCustomerId,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: "subscription",
                success_url: settingsUrl + "?success=true",
                cancel_url: settingsUrl + "?canceled=true",
                metadata: {
                    userId: session.user.id,
                },
            });
        } catch (error: any) {
            // If the customer does not exist in Stripe, recreate it
            if (error.code === "resource_missing" && error.param === "customer") {
                const customer = await stripe.customers.create({
                    email: session.user.email,
                    name: session.user.name || undefined,
                    metadata: {
                        userId: session.user.id,
                    },
                });

                stripeCustomerId = customer.id;

                await prisma.user.update({
                    where: {
                        id: session.user.id,
                    },
                    data: {
                        stripeCustomerId,
                    },
                });

                stripeSession = await stripe.checkout.sessions.create({
                    customer: stripeCustomerId,
                    line_items: [
                        {
                            price: priceId,
                            quantity: 1,
                        },
                    ],
                    mode: "subscription",
                    success_url: settingsUrl + "?success=true",
                    cancel_url: settingsUrl + "?canceled=true",
                    metadata: {
                        userId: session.user.id,
                    },
                });
            } else {
                throw error;
            }
        }

        return NextResponse.json({ url: stripeSession.url });
    } catch (error: any) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
