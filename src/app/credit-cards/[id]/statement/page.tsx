import { getCreditCardById, getCreditCards } from "@/actions/credit-card";
import { getCategories } from "@/actions/category";
import { getAccounts } from "@/actions/account";
import { StatementClient } from "./statement-client";
import { notFound } from "next/navigation";

export default async function CreditCardStatementPage({ params }: { params: { id: string } }) {
    const card = await getCreditCardById(params.id);
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
