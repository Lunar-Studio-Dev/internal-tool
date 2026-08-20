import { setClientDecisionAction } from "@/features/phases/server/decision.actions";
import { getPipelineDecision } from "@/features/phases/server/phases.queries";
import { fromService, handleApi, jsonData, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    return jsonData(await getPipelineDecision(id));
  });
}

export async function POST(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    return fromService(await setClientDecisionAction({ ...body, pipelineId: id }));
  });
}
