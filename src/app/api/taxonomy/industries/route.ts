import { createIndustryAction } from "@/features/taxonomy/server/taxonomy.actions";
import { listIndustries } from "@/features/taxonomy/server/taxonomy.queries";
import { handleApi, jsonData, jsonError, readJson } from "@/lib/api/http";

export async function GET(request: Request) {
  return handleApi(async () => {
    const { searchParams } = new URL(request.url);
    const sectorId = searchParams.get("sectorId") ?? undefined;
    return jsonData(await listIndustries(sectorId));
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid request body.");
    const result = await createIndustryAction(body);
    if (!result.ok) return jsonError(result.error);
    return jsonData({ id: result.id, name: result.name }, 201);
  });
}
