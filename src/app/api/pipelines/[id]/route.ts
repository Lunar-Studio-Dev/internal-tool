import { getPipelineById } from "@/features/pipelines/server/pipelines.queries";
import { handleApi, jsonData, jsonError, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const pipeline = await getPipelineById(id);
    if (!pipeline) return jsonError("Pipeline not found.", 404);
    return jsonData(pipeline);
  });
}
