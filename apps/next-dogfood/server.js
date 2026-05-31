import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { attachNuvioToNextServer } from "@nuvio/next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT ?? 3001);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url ?? "", true);
  void handle(req, res, parsedUrl);
});

attachNuvioToNextServer(server, { root: process.cwd(), verbose: false });

server.listen(port, () => {
  console.log(`> Next dogfood ready on http://${hostname}:${port} (Nuvio dev enabled)`);
});
