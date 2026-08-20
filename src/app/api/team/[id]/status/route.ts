import { setMemberStatusAction } from "@/features/team/server/team.actions";
import { memberStatusSchema } from "@/features/team/schemas/team.schema";
import { fromService, handleApi, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function POST(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    const parsed = memberStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Status must be ACTIVE or INACTIVE.");
    }
    return fromService(await setMemberStatusAction(id, parsed.data.status));
  });
}
