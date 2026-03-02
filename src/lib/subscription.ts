import { prisma as db } from "./prisma";
import { stripe } from "./stripe";

const DAY_IN_MS = 86_400_000;

export async function getUserSubscriptionPlan(userId: string) {
    const user = await db.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            email: true,
            stripeSubscriptionId: true,
            stripeCurrentPeriodEnd: true,
            stripeCustomerId: true,
            stripePriceId: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    let stripeCustomerId = user.stripeCustomerId;

    // 1. Resolver Customer ID se estiver faltando
    if (!stripeCustomerId) {
        try {
            const customers = await stripe.customers.list({
                email: user.email || "",
                limit: 1,
            });

            if (customers.data.length > 0) {
                stripeCustomerId = customers.data[0].id;
                await db.user.update({
                    where: { id: userId },
                    data: { stripeCustomerId },
                });
                console.log(`[SUBSCRIPTION_SYNC] Customer found by email: ${stripeCustomerId}`);
            }
        } catch (error) {
            console.error("[SUBSCRIPTION_SYNC_EMAIL_ERROR]", error);
        }
    }

    // 2. Sincronizar assinatura SEMPRE que houver um customerId 
    // Isso garante que mudanças de plano (mesmo que offline/webhook falhe) sejam refletidas
    if (stripeCustomerId) {
        try {
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                status: "all", // Ver todos para identificar cancelados vs ativos
                expand: ["data.default_payment_method"],
            });

            // Priorizar assinaturas ATIVAS ou em TRIAL, e pegar a mais RECENTE de todas
            const activeSubs = subscriptions.data
                .filter(s => s.status === "active" || s.status === "trialing")
                .sort((a, b) => b.created - a.created);

            if (activeSubs.length > 0) {
                const sub = activeSubs[0] as any;
                const newPriceId = sub.items.data[0].price.id;
                const newPeriodEnd = new Date(sub.current_period_end * 1000);

                // Só atualizar se algo mudou (para evitar writes desnecessários)
                if (
                    user.stripeSubscriptionId !== sub.id ||
                    user.stripePriceId !== newPriceId ||
                    user.stripeCurrentPeriodEnd?.getTime() !== newPeriodEnd.getTime()
                ) {
                    console.log(`[SUBSCRIPTION_SYNC] Updating to latest active sub: ${sub.id}`);
                    const updatedUser = await db.user.update({
                        where: { id: userId },
                        data: {
                            stripeSubscriptionId: sub.id,
                            stripePriceId: newPriceId,
                            stripeCurrentPeriodEnd: newPeriodEnd,
                        },
                    });

                    user.stripeSubscriptionId = updatedUser.stripeSubscriptionId;
                    user.stripePriceId = updatedUser.stripePriceId;
                    user.stripeCurrentPeriodEnd = updatedUser.stripeCurrentPeriodEnd;
                }
            } else if (user.stripeSubscriptionId) {
                // Se o banco acha que tem assinatura mas o Stripe diz que não tem nada ativo
                // Verificamos se a assinatura que temos no banco ainda é válida no tempo
                const isStillValidByDate = user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

                if (!isStillValidByDate) {
                    // Se expirou e não tem nada ativo no Stripe, limpamos o PriceId do banco
                    console.log(`[SUBSCRIPTION_SYNC] No active sub in Stripe and local expired. Clearing PriceId.`);
                    await db.user.update({
                        where: { id: userId },
                        data: {
                            stripePriceId: null,
                        },
                    });
                    user.stripePriceId = null;
                }
            }
        } catch (error) {
            console.error("[SUBSCRIPTION_SYNC_ERROR]", error);
        }
    }

    // 3. Validar se o plano Pro é válido (mesmo que cancelado, vale até o period_end)
    const isPro =
        user.stripePriceId &&
        user.stripeCurrentPeriodEnd &&
        user.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();

    return {
        ...user,
        stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.getTime() || 0,
        isPro: !!isPro,
        planId: user.stripePriceId,
    };
}
