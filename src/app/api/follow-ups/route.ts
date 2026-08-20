import { createFollowUpAction } from "@/features/followups/server/followups.actions";
import { fromService, handleApi, jsonError, readJson } from "@/lib/api/http";

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid request body.");
    return fromService(await createFollowUpAction(body));
  });
}
