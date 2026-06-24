import type { Server as HttpServer } from "node:http";
import {
  attachNuvioDevSession,
  NUVIO_NEXT_SCAN_GLOBS,
  type NuvioDevSessionHandle,
  type NuvioDevSessionOptions,
} from "@nuvio/vite-plugin/dev-session";

export type NuvioNextOptions = Omit<NuvioDevSessionOptions, "root"> & {
  /** Project root (where package.json lives). Defaults to process.cwd(). */
  root?: string;
};

/**
 * Attach Nuvio to a Next.js custom dev server HTTP instance.
 * Use with `node server.js` during development (App Router client components).
 */
export function attachNuvioToNextServer(
  httpServer: HttpServer,
  options?: NuvioNextOptions,
): NuvioDevSessionHandle {
  return attachNuvioDevSession(httpServer, {
    ...options,
    root: options?.root ?? process.cwd(),
    scanGlobs: options?.scanGlobs ?? [...NUVIO_NEXT_SCAN_GLOBS],
  });
}

export type { NuvioDevSessionHandle, NuvioDevSessionOptions };
export { NUVIO_NEXT_SCAN_GLOBS };
