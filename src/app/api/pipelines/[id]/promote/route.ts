import { promotePipelineAction } from "@/features/pipelines/server/pipelines.actions";
import { fromService, handleApi, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function POST(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    const notes =
      body && typeof body === "object" && body !== null && "notes" in body
        ? (body as { notes?: string }).notes
        : undefined;
    return fromService(await promotePipelineAction({ pipelineId: id, notes }));
  });
}
