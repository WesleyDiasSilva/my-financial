import { getCreditCardById, getCreditCards } from "@/actions/credit-card";
import { getCategories } from "@/actions/category";
import { getAccounts } from "@/actions/account";
import { StatementClient } from "./statement-client";
import { notFound } from "next/navigation";

export default async function CreditCardStatementPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const card = await getCreditCardById(resolvedParams.id);
    if (!card) notFound();

    const [categories, creditCards, accounts] = await Promise.all([
        getCategories(),
        getCreditCards(),
        getAccounts()
    ]);

    return (
        <StatementClient
            card={card}
            categories={categories}
            creditCards={creditCards}
            accounts={accounts}
        />
    );
}
