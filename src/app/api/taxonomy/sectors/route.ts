import { createSectorAction } from "@/features/taxonomy/server/taxonomy.actions";
import { listSectors } from "@/features/taxonomy/server/taxonomy.queries";
import { handleApi, jsonData, jsonError, readJson } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listSectors()));
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid request body.");
    const result = await createSectorAction(body);
    if (!result.ok) return jsonError(result.error);
    return jsonData({ id: result.id, name: result.name }, 201);
  });
}
