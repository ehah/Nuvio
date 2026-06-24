import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_BRAND_CONFIG,
  NUVIO_BRAND_PATH,
  NUVIO_PCC_PATH,
  serializeBrandConfig,
} from "@nuvio/shared";
import { tryHandleNuvioConfigHttp } from "./nuvio-config-http.js";

describe("nuvio-config-http", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = "";
    }
  });

  function startTestServer(root: string) {
    return createServer((req, res) => {
      void tryHandleNuvioConfigHttp(req, res, {
        projectRoot: root,
        writeGuardRoot: root,
      });
    });
  }

  async function fetchLocal(
    port: number,
    urlPath: string,
    init?: RequestInit,
  ): Promise<Response> {
    return fetch(`http://127.0.0.1:${port}${urlPath}`, init);
  }

  it("serves default brand config on GET", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nuvio-config-http-"));
    const server = startTestServer(tmpDir);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const res = await fetchLocal(port, NUVIO_BRAND_PATH);
    expect(res.status).toBe(200);
    const json = (await res.json()) as typeof DEFAULT_BRAND_CONFIG;
    expect(json.color).toBe(DEFAULT_BRAND_CONFIG.color);

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("persists brand config on PUT", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nuvio-config-http-"));
    const server = startTestServer(tmpDir);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const nextBrand = { ...DEFAULT_BRAND_CONFIG, color: "green" as const };
    const put = await fetchLocal(port, NUVIO_BRAND_PATH, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextBrand),
    });
    expect(put.status).toBe(200);

    const get = await fetchLocal(port, NUVIO_BRAND_PATH);
    const saved = (await get.json()) as { color: string };
    expect(saved.color).toBe("green");
    expect(
      fs.existsSync(path.join(tmpDir, "nuvio/brand.json")),
    ).toBe(true);

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("returns PCC manifest by route", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nuvio-config-http-"));
    const pagesDir = path.join(tmpDir, "nuvio/pages");
    fs.mkdirSync(pagesDir, { recursive: true });
    fs.writeFileSync(
      path.join(pagesDir, "home.pcc.yaml"),
      `page: home
route: /
categories:
  heading:
    required: true
    hosts:
      - page.title
`,
      "utf8",
    );
    fs.writeFileSync(
      path.join(tmpDir, "nuvio/brand.json"),
      `${JSON.stringify(serializeBrandConfig(DEFAULT_BRAND_CONFIG), null, 2)}\n`,
      "utf8",
    );

    const server = startTestServer(tmpDir);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const res = await fetchLocal(port, `${NUVIO_PCC_PATH}?route=/`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; manifest: { page: string } };
    expect(json.ok).toBe(true);
    expect(json.manifest.page).toBe("home");

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("ignores unrelated paths", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nuvio-config-http-"));
    let handled = false;
    const server = createServer((req, res) => {
      void (async () => {
        handled = await tryHandleNuvioConfigHttp(req, res, {
          projectRoot: tmpDir,
          writeGuardRoot: tmpDir,
        });
        if (!handled) {
          res.statusCode = 404;
          res.end("not found");
        }
      })();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    const res = await fetchLocal(port, "/some-page");
    expect(res.status).toBe(404);
    expect(handled).toBe(false);

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
