import { hangQuery, isAbortError } from "@/lib/api/abort";

export type Jsonify<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Jsonify<U>[]
    : T extends object
      ? { [K in keyof T]: Jsonify<T[K]> }
      : T;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiSuccess<T> = { data: T };
type ApiFailure = { error: string; duplicates?: unknown };

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const signal = init?.signal;
  const cancellable = Boolean(signal);

  if (signal?.aborted) {
    return hangQuery<T>();
  }

  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  try {
    const res = await fetch(path, {
      ...init,
      credentials: "include",
      headers,
    });

    if (signal?.aborted) {
      return hangQuery<T>();
    }

    const body = (await parseBody(res)) as ApiSuccess<T> | ApiFailure | null;

    if (!res.ok) {
      const message =
        body && typeof body === "object" && "error" in body && body.error
          ? body.error
          : res.statusText || "Request failed";
      throw new ApiError(res.status, message, body);
    }

    if (body && typeof body === "object" && "data" in body) {
      return (body as ApiSuccess<T>).data;
    }
    return body as T;
  } catch (error) {
    if (cancellable && isAbortError(error)) {
      return hangQuery<T>();
    }
    throw error;
  }
}
