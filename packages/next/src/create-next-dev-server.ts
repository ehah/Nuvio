import { createServer } from "node:http";
import type { Server as HttpServer } from "node:http";
import { parse } from "node:url";
import { tryHandleNuvioConfigHttp } from "@nuvio/vite-plugin/dev-session";
import {
  attachNuvioToNextServer,
  type NuvioNextOptions,
} from "./attach-next-server.js";

export type CreateNuvioNextDevServerOptions = {
  /** Project root (Next app directory). Defaults to `process.cwd()`. */
  root?: string;
  hostname?: string;
  port?: number;
  /** Passed through to {@link attachNuvioToNextServer}. */
  nuvio?: Omit<NuvioNextOptions, "root">;
  /** When true (default), call `server.listen` and log the URL. */
  listen?: boolean;
};

export type NuvioNextDevServer = {
  httpServer: HttpServer;
  port: number;
  hostname: string;
  url: string;
};

/**
 * Create a Next.js custom dev server with Nuvio WebSocket + source index attached.
 * Use in `server.js` during development instead of `next dev` when you need Nuvio.
 */
export async function createNuvioNextDevServer(
  options?: CreateNuvioNextDevServerOptions,
): Promise<NuvioNextDevServer> {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = options?.hostname ?? "localhost";
  const port = options?.port ?? Number(process.env.PORT ?? 3000);
  const root = options?.root ?? process.cwd();

  const nextModule = await import("next");
  const next = nextModule.default as unknown as (options: {
    dev: boolean;
    hostname: string;
    port: number;
    dir: string;
  }) => {
    prepare: () => Promise<void>;
    getRequestHandler: () => (
      req: import("node:http").IncomingMessage,
      res: import("node:http").ServerResponse,
      parsedUrl: import("node:url").UrlWithParsedQuery,
    ) => void | Promise<void>;
  };
  const app = next({ dev, hostname, port, dir: root });
  const handle = app.getRequestHandler();
  await app.prepare();

  const httpServer = createServer((req, res) => {
    void (async () => {
      const writeGuardRoot = root;
      if (
        await tryHandleNuvioConfigHttp(req, res, {
          projectRoot: root,
          writeGuardRoot,
        })
      ) {
        return;
      }
      const parsedUrl = parse(req.url ?? "", true);
      void handle(req, res, parsedUrl);
    })();
  });

  attachNuvioToNextServer(httpServer, {
    root,
    ...options?.nuvio,
  });

  const url = `http://${hostname}:${port}`;

  if (options?.listen !== false) {
    await new Promise<void>((resolveListen, reject) => {
      httpServer.listen(port, () => resolveListen());
      httpServer.on("error", reject);
    });
    console.log(`> Next ready on ${url} (Nuvio dev enabled)`);
  }

  return { httpServer, port, hostname, url };
}
