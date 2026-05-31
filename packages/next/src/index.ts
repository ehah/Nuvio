import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import {
  attachNuvioDevSession,
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
  });
}

export type { NuvioDevSessionHandle, NuvioDevSessionOptions };

/** @deprecated use attachNuvioToNextServer */
export function attachNuvioToServer(
  httpServer: HttpServer,
  options?: NuvioNextOptions,
): NuvioDevSessionHandle {
  return attachNuvioToNextServer(httpServer, options);
}

export type NextUpgradeHandler = (
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
) => void;
