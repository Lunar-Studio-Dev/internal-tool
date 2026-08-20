import { updateMemberAction } from "@/features/team/server/team.actions";
import { getMemberById } from "@/features/team/server/team.queries";
import { fromService, handleApi, jsonData, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const member = await getMemberById(id);
    if (!member) return jsonError("Member not found.", 404);
    return jsonData(member);
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    return fromService(await updateMemberAction({ ...body, id }));
  });
}
