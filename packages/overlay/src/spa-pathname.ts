import { useEffect, useState } from "react";

/** Track SPA pathname changes (popstate + patched history). */
export function useSpaPathname(): string {
  const [pathname, setPathname] = useState(() =>
    typeof window === "undefined" ? "/" : window.location.pathname,
  );

  useEffect(() => {
    const sync = () => {
      const next = window.location.pathname;
      setPathname((prev) => (prev === next ? prev : next));
    };

    window.addEventListener("popstate", sync);
    const onNavigateHint = () => queueMicrotask(sync);
    // Framework routers (e.g. Next App Router) may navigate without our history patch.
    document.addEventListener("click", onNavigateHint, true);

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      originalPushState(...args);
      sync();
    };
    history.replaceState = (...args) => {
      originalReplaceState(...args);
      sync();
    };

    return () => {
      window.removeEventListener("popstate", sync);
      document.removeEventListener("click", onNavigateHint, true);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return pathname;
}

/** Prefer host framework pathname (Next `usePathname`) when provided; else SPA tracking. */
export function useOverlayPathname(externalPathname?: string): string {
  const spaPathname = useSpaPathname();
  return externalPathname ?? spaPathname;
}
