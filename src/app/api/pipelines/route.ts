import { createPipelineAction } from "@/features/pipelines/server/pipelines.actions";
import { listPipelines } from "@/features/pipelines/server/pipelines.queries";
import { fromService, handleApi, jsonData, jsonError, readJson } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listPipelines()));
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined) return jsonError("Invalid request body.");
    return fromService(await createPipelineAction(body), true);
  });
}
