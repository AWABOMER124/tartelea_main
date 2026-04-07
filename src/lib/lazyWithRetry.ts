import { lazy } from "react";

const LAZY_RETRY_STORAGE_KEY = "app-lazy-retry";

export const lazyWithRetry = <T extends { default: React.ComponentType<any> }>(
  importer: () => Promise<T>
) => {
  return lazy(async () => {
    const hasRetried = sessionStorage.getItem(LAZY_RETRY_STORAGE_KEY) === "true";

    try {
      const module = await importer();
      sessionStorage.removeItem(LAZY_RETRY_STORAGE_KEY);
      return module;
    } catch (error) {
      const isChunkLoadError =
        error instanceof Error &&
        /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk [\d\w-]+ failed/i.test(error.message);

      if (isChunkLoadError && !hasRetried) {
        sessionStorage.setItem(LAZY_RETRY_STORAGE_KEY, "true");
        window.location.reload();
        return new Promise<T>(() => {});
      }

      sessionStorage.removeItem(LAZY_RETRY_STORAGE_KEY);
      throw error;
    }
  });
};
