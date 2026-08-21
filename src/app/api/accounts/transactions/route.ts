import {
  listRecentTransactions,
  listTransactions,
} from "@/features/accounts/server/accounts.queries";
import { addTransactionAction } from "@/features/accounts/server/accounts.actions";
import { TransactionType } from "@/generated/prisma/enums";
import { handleApi, jsonData, jsonError, readJson } from "@/lib/api/http";

export async function GET(request: Request) {
  return handleApi(async () => {
    const url = new URL(request.url);
    const recent = url.searchParams.get("recent");
    if (recent === "1") {
      return jsonData(await listRecentTransactions());
    }

    const typeParam = url.searchParams.get("type");
    const type =
      typeParam === TransactionType.EARNING || typeParam === TransactionType.EXPENSE
        ? typeParam
        : typeParam === "ALL" || !typeParam
          ? "ALL"
          : undefined;

    return jsonData(
      await listTransactions({
        type,
        businessId: url.searchParams.get("businessId") ?? undefined,
        fromDate: url.searchParams.get("fromDate") ?? undefined,
        toDate: url.searchParams.get("toDate") ?? undefined,
        search: url.searchParams.get("search") ?? undefined,
      }),
    );
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    const result = await addTransactionAction(body);
    if (!result.ok) return jsonError(result.error);
    return jsonData({ id: result.id }, 201);
  });
}
