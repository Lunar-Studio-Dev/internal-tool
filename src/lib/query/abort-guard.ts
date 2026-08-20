import { isAbortError } from "@/lib/api/abort";

// Register before React mounts so early navigations don't log spurious AbortErrors.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (isAbortError(event.reason)) {
      event.preventDefault();
    }
  });
}
