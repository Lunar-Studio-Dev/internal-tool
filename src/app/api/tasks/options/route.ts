import { listTaskOptions } from "@/features/tasks/server/tasks.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listTaskOptions()));
}
