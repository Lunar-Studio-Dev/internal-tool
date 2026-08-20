import {
  QueryClient,
  isServer,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { isAbortError } from "@/lib/api/abort";

function shouldRetryQuery(failureCount: number, error: Error) {
  if (isAbortError(error)) return false;
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: shouldRetryQuery,
      },
      mutations: { retry: 0 },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient(); // always a fresh client on the server
  return (browserQueryClient ??= makeQueryClient()); // singleton in the browser
}
