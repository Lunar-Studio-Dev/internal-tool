import { getResourceDownloadUrlAction } from "@/features/resources/server/resources.actions";
import { handleApi, jsonData, jsonError, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const result = await getResourceDownloadUrlAction(id);
    if (!result.ok) return jsonError(result.error, 404);
    return jsonData({ url: result.url });
  });
}
