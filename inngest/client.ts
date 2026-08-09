// src/inngest/client.ts
import { Inngest } from "inngest";

let inngest: Inngest;


function getInngestClient() {
    if (!inngest) {
        inngest = new Inngest({ id: "internal-tool" });
    }
    return inngest;
}

export default getInngestClient();