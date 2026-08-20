import { updateContactAction } from "@/features/businesses/server/businesses.actions";
import { fromService, handleApi, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    return fromService(await updateContactAction({ ...body, id }));
  });
}
