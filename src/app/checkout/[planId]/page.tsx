import CheckoutClient from "./_components/CheckoutClient";

export default async function CheckoutPage({ params }: { params: Promise<{ planId: string }> }) {
    const { planId } = await params;
    return <CheckoutClient planId={planId} />;
}
