import { getTemplates } from "@/app/dashboard/templates/actions";
import NewQuotationClient from "./client-page";

export default async function NewQuotationPage() {
    const templates = await getTemplates();
    return <NewQuotationClient templates={templates} />;
}
