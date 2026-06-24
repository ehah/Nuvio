import type { IncomingMessage, ServerResponse } from "node:http";
import { NUVIO_BRAND_PATH, NUVIO_PCC_PATH } from "@nuvio/shared";
import { handleBrandConfigHttp } from "./handle-brand-config.js";
import { handlePccConfigHttp } from "./handle-pcc-config.js";

export type NuvioConfigHttpContext = {
  projectRoot: string;
  writeGuardRoot: string;
};

function pathnameFromUrl(url: string): string {
  return url.split("?")[0] ?? "";
}

/**
 * Handle Brand Kit (`NUVIO_BRAND_PATH`) and PCC (`NUVIO_PCC_PATH`) HTTP for any dev server.
 * Returns true when the request was handled (caller should not pass to Next/Vite).
 */
export async function tryHandleNuvioConfigHttp(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: NuvioConfigHttpContext,
): Promise<boolean> {
  const pathname = pathnameFromUrl(req.url ?? "");
  if (pathname === NUVIO_PCC_PATH) {
    await handlePccConfigHttp(req, res, ctx);
    return true;
  }
  if (pathname === NUVIO_BRAND_PATH) {
    await handleBrandConfigHttp(req, res, ctx);
    return true;
  }
  return false;
}
