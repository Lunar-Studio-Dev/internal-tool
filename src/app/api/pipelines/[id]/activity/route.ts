import { getPipelineActivity } from "@/features/pipelines/server/pipelines.queries";
import { handleApi, jsonData, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    return jsonData(await getPipelineActivity(id));
  });
}
