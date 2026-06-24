import { createNuvioNextDevServer } from "@nuvio/next";

await createNuvioNextDevServer({
  port: Number(process.env.PORT ?? 3001),
});
