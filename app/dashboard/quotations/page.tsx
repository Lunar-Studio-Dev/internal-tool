import { getQuotations } from "./actions";
import QuotationsClient from "./client-page";

export default async function QuotationsPage() {
    const quotations = await getQuotations();

    return <QuotationsClient initialQuotations={quotations} />;
}