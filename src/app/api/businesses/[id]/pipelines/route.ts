import { listPipelinesForBusiness } from "@/features/businesses/server/businesses.queries";
import { handleApi, jsonData, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    return jsonData(await listPipelinesForBusiness(id));
  });
}
