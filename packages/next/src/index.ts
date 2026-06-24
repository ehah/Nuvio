import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import {
  attachNuvioToNextServer,
  NUVIO_NEXT_SCAN_GLOBS,
  type NuvioDevSessionHandle,
  type NuvioDevSessionOptions,
  type NuvioNextOptions,
} from "./attach-next-server.js";

export type { NuvioNextOptions, NuvioDevSessionHandle, NuvioDevSessionOptions };
export { attachNuvioToNextServer, NUVIO_NEXT_SCAN_GLOBS };

export { withNuvio, type WithNuvioOptions } from "./with-nuvio.js";
export {
  createNuvioNextDevServer,
  type CreateNuvioNextDevServerOptions,
  type NuvioNextDevServer,
} from "./create-next-dev-server.js";

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
