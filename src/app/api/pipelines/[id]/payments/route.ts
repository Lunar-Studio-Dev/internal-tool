import { listPaymentsForPipeline } from "@/features/payments/server/payments.queries";
import { recordPaymentAction } from "@/features/payments/server/payments.actions";
import { handleApi, jsonData, jsonError, readJson, type RouteContext } from "@/lib/api/http";

export async function GET(_request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    return jsonData(await listPaymentsForPipeline(id));
  });
}

export async function POST(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const body = await readJson(request);
    if (body === undefined || typeof body !== "object" || body === null) {
      return jsonError("Invalid request body.");
    }
    const result = await recordPaymentAction({ ...body, pipelineId: id });
    if (!result.ok) return jsonError(result.error);
    return jsonData(
      { id: result.id, promoted: result.promoted, fullyPaid: result.fullyPaid },
      201,
    );
  });
}
