import { deactivatePipelineAction } from "@/features/pipelines/server/pipelines.actions";
import { fromService, handleApi, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function POST(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    return fromService(await deactivatePipelineAction({ ...body, pipelineId: id }));
  });
}
