"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { NuvioDevShellInner } from "./NuvioDevShell.js";

/**
 * Dev-only overlay shell for Next.js App/Pages Router.
 * Use in root layout or `_app` — file is a Client Component (`"use client"`).
 *
 * Light-DOM chrome: Next webpack bundles overlay CSS (see `@nuvio/overlay/style.css` in layout).
 * Client-only mount avoids SSR hydration mismatches on WS status / localStorage.
 */
export function NuvioNextShell(): ReactElement | null {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null;
  }
  if (!mounted) {
    return null;
  }
  return (
    <NuvioDevShellInner chromeMount="light" routePathname={pathname ?? "/"} />
  );
}
