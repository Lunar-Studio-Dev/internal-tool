import { listAllDeactivationReasons } from "@/features/settings/server/settings.queries";
import { getTaxonomyAdminData } from "@/features/taxonomy/server/taxonomy.queries";
import { handleApi, jsonData } from "@/lib/api/http";

export async function GET() {
  return handleApi(async () =>
    jsonData({
      deactivationReasons: await listAllDeactivationReasons(),
      taxonomy: await getTaxonomyAdminData(),
    }),
  );
}
