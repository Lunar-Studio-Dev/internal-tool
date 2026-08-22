import { getDashboardData } from "@/features/dashboard/server/dashboard.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await getDashboardData()));
}
