import { createBusinessAction } from "@/features/businesses/server/businesses.actions";
import { listBusinesses } from "@/features/businesses/server/businesses.queries";
import { fromService, handleApi, jsonData, jsonError, readJson } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listBusinesses()));
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid request body.");
    return fromService(await createBusinessAction(body), true);
  });
}
