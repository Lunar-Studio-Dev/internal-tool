import { deleteResourceAction } from "@/features/resources/server/resources.actions";
import { getResourceById } from "@/features/resources/server/resources.queries";
import { fromService, handleApi, jsonData, jsonError, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const resource = await getResourceById(id);
    if (!resource) return jsonError("Resource not found.", 404);
    return jsonData(resource);
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    return fromService(await deleteResourceAction(id));
  });
}
