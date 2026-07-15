import { getTemplates } from "./actions";
import TemplatesClient from "./client-page";

export default async function TemplatesPage() {
    const templates = await getTemplates();
    return <TemplatesClient initialTemplates={templates} />;
}