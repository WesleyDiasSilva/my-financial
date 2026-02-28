import { getCreditCards } from "@/actions/credit-card";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { CreditCardsClient } from "./credit-cards-client";

export default async function CreditCardsPage() {
    const cards = await getCreditCards();
    const accounts = await getAccounts();
    const categories = await getCategories();

    return (
        <CreditCardsClient
            initialCards={cards}
            initialAccounts={accounts}
            initialCategories={categories}
        />
    );
}
