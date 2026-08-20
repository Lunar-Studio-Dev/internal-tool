import { listResourceOptions } from "@/features/resources/server/resources.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listResourceOptions()));
}
