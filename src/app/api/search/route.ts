import { globalSearch } from "@/features/search/server/search.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET(request: Request) {
  return handleApi(async () => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    return jsonData(await globalSearch(q));
  });
}
