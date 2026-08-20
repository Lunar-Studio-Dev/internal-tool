import { createMemberAction } from "@/features/team/server/team.actions";
import { listMembers } from "@/features/team/server/team.queries";
import { fromService, handleApi, jsonData, jsonError, readJson } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listMembers()));
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid request body.");
    return fromService(await createMemberAction(body));
  });
}
