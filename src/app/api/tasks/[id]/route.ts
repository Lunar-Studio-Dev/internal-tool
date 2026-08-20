import { updateTaskAction } from "@/features/tasks/server/tasks.actions";
import { getTaskById } from "@/features/tasks/server/tasks.queries";
import { fromService, handleApi, jsonData, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const task = await getTaskById(id);
    if (!task) return jsonError("Task not found.", 404);
    return jsonData(task);
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    return fromService(await updateTaskAction({ ...body, id }));
  });
}
