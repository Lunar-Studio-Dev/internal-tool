import { reassignTaskAction } from "@/features/tasks/server/tasks.actions";
import { fromService, handleApi, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function POST(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    return fromService(await reassignTaskAction({ ...body, id }));
  });
}
