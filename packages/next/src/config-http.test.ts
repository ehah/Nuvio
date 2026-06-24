import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { tryHandleNuvioConfigHttp } from "@nuvio/vite-plugin/dev-session";

const BRAND_PATH = "/__nuvio/brand";

describe("tryHandleNuvioConfigHttp export", () => {
  it("is re-exported from dev-session", () => {
    expect(typeof tryHandleNuvioConfigHttp).toBe("function");
  });

  it("handles brand on bare http server", async () => {
    const server = createServer((req, res) => {
      void tryHandleNuvioConfigHttp(req, res, {
        projectRoot: process.cwd(),
        writeGuardRoot: process.cwd(),
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;
    const res = await fetch(`http://127.0.0.1:${port}${BRAND_PATH}`);
    expect(res.status).toBe(200);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
