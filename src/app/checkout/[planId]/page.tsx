import CheckoutClient from "./_components/CheckoutClient";

export default async function CheckoutPage({
    params,
    searchParams
}: {
    params: Promise<{ planId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { planId } = await params;
    const resolvedSearchParams = await searchParams;
    const billing = (resolvedSearchParams?.billing as "monthly" | "yearly") || "monthly";

    return <CheckoutClient planId={planId} billing={billing} />;
}
