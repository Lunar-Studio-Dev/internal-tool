import { getResourceFileMetaAction } from "@/features/resources/server/resources.actions";
import { handleApi, jsonError, type RouteContext } from "@/lib/api/http";
import { getObject } from "@/lib/r2";

function contentDisposition(kind: "inline" | "attachment", filename: string) {
  const cleaned = filename.replace(/[\r\n"]/g, "_").trim() || "file";
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
}

export async function GET(request: Request, context: RouteContext) {
  return handleApi(async () => {
    const { id } = await context.params;
    const download = new URL(request.url).searchParams.get("download") === "1";

    const meta = await getResourceFileMetaAction(id);
    if (!meta.ok) return jsonError(meta.error, meta.status);

    let object;
    try {
      object = await getObject(meta.objectKey);
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "NoSuchKey" || name === "NotFound") {
        return jsonError("File not found in storage.", 404);
      }
      throw error;
    }
    if (!object) return jsonError("File could not be read.", 404);

    const headers = new Headers({
      "Content-Type": meta.contentType || object.contentType || "application/octet-stream",
      "Content-Disposition": contentDisposition(download ? "attachment" : "inline", meta.name),
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    });
    if (object.contentLength != null) {
      headers.set("Content-Length", String(object.contentLength));
    }

    return new Response(object.body, { status: 200, headers });
  });
}
