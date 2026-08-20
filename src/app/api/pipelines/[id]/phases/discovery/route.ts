import { saveDiscoveryAction } from "@/features/phases/server/phases.actions";
import { fromService, handleApi, readJson, type RouteContext } from "@/lib/api/http";

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    const input =
      body && typeof body === "object" && body !== null
        ? { ...(body as Record<string, unknown>), pipelineId: id }
        : { pipelineId: id };
    return fromService(await saveDiscoveryAction(input));
  });
}
