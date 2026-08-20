import { listPipelineCreateOptions } from "@/features/pipelines/server/pipelines.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listPipelineCreateOptions()));
}
