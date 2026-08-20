import { createTaskAction } from "@/features/tasks/server/tasks.actions";
import { listTasks } from "@/features/tasks/server/tasks.queries";
import { fromService, handleApi, jsonData, jsonError, readJson } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listTasks()));
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid request body.");
    return fromService(await createTaskAction(body), true);
  });
}
