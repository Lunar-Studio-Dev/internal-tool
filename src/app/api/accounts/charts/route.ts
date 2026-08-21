import {
  earningsVsExpensesByMonth,
  revenueByMonth,
} from "@/features/accounts/server/accounts.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET(request: Request) {
  return handleApi(async () => {
    const url = new URL(request.url);
    const chart = url.searchParams.get("chart");

    if (chart === "earnings-vs-expenses") {
      return jsonData(await earningsVsExpensesByMonth());
    }

    return jsonData(await revenueByMonth());
  });
}
