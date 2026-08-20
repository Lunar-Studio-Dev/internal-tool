import { getContactInfoForPipeline, getPhasePayloads } from "@/features/phases/server/phases.queries";
import { handleApi, jsonData, jsonError, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const [payloads, contactInfo] = await Promise.all([
      getPhasePayloads(id),
      getContactInfoForPipeline(id),
    ]);
    if (!contactInfo) return jsonError("Pipeline not found.", 404);
    return jsonData({ ...payloads, contactInfo });
  });
}
