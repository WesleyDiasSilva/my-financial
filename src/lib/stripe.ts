import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock123", {
    apiVersion: "2025-02-24.acacia" as any,
    appInfo: {
        name: "MyLife App",
        version: "0.1.0",
    },
})
