import { getAnalyticsBundle } from "@/features/analytics/server/analytics.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET(request: Request) {
  return handleApi(async () => {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") ?? "overview";
    const period = (searchParams.get("period") ?? "monthly") as
      | "monthly"
      | "quarterly"
      | "yearly";
    return jsonData(await getAnalyticsBundle(tab, period));
  });
}
