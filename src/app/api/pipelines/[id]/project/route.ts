import { createProjectAction } from "@/features/projects/server/projects.actions";
import { getProjectSetupContext } from "@/features/projects/server/projects.queries";
import { fromService, handleApi, jsonData, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    return jsonData(await getProjectSetupContext(id));
  });
}

export async function POST(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    return fromService(await createProjectAction({ ...body, pipelineId: id }), true);
  });
}
