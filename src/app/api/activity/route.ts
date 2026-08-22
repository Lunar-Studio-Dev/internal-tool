import { getActivityTimelinePage } from "@/features/activity/server/activity.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET(request: Request) {
  return handleApi(async () => {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const businessId = searchParams.get("businessId") ?? undefined;
    const pipelineId = searchParams.get("pipelineId") ?? undefined;
    const actorId = searchParams.get("actorId") ?? undefined;
    return jsonData(
      await getActivityTimelinePage({ cursor, businessId, pipelineId, actorId }),
    );
  });
}
