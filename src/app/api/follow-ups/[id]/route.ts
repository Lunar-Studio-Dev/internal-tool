import { updateFollowUpAction } from "@/features/followups/server/followups.actions";
import { fromService, handleApi, type RouteContext } from "@/lib/api/http";

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await request.json();
    return fromService(await updateFollowUpAction(id, body));
  });
}
