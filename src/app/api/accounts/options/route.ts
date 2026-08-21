import { listAccountsFormOptions } from "@/features/accounts/server/accounts.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () => jsonData(await listAccountsFormOptions()));
}
