import { createResourceAction } from "@/features/resources/server/resources.actions";
import { listResources } from "@/features/resources/server/resources.queries";
import { fromService, handleApi, jsonData, jsonError, readJson } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listResources()));
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid request body.");
    return fromService(await createResourceAction(body));
  });
}
