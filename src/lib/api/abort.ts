/** True when a fetch/query was cancelled via AbortSignal (navigation, unmount, refetch). */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}

/**
 * Never resolves. Used when a React Query request is aborted so the rejection
 * does not surface as an unhandled promise rejection in the browser.
 */
export function hangQuery<T>(): Promise<T> {
  return new Promise(() => {});
}
