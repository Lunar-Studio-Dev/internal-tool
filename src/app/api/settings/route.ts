import { getAppSettings } from "@/lib/app-settings";
import { listAllDeactivationReasons } from "@/features/settings/server/settings.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () =>
    jsonData({
      settings: await getAppSettings(),
      deactivationReasons: await listAllDeactivationReasons(),
    }),
  );
}
