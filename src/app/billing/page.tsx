import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import BillingClient from "./_components/BillingClient";
import { redirect } from "next/navigation";

export default async function BillingPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const subscription = await getUserSubscriptionPlan(session.user.id);

    return <BillingClient subscription={subscription} />;
}

