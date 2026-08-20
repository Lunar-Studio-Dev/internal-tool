import { completeTaskAction } from "@/features/tasks/server/tasks.actions";
import { fromService, handleApi, type RouteContext } from "@/lib/api/http";

export async function POST(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    return fromService(await completeTaskAction(id));
  });
}
