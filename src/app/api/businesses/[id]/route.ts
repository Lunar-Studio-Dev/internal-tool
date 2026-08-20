import { updateBusinessAction } from "@/features/businesses/server/businesses.actions";
import { getBusinessById } from "@/features/businesses/server/businesses.queries";
import { fromService, handleApi, jsonData, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const business = await getBusinessById(id);
    if (!business) return jsonError("Business not found.", 404);
    return jsonData(business);
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    return fromService(await updateBusinessAction({ ...body, id }));
  });
}
