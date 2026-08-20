import { listTasksForPipeline } from "@/features/tasks/server/tasks.queries";
import { handleApi, jsonData, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    return jsonData(await listTasksForPipeline(id));
  });
}
