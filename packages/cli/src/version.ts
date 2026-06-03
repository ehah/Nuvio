import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Installed @nuvio/cli semver (from package.json). */
export const NUVIO_VERSION: string = (
  require("../package.json") as { version: string }
).version;
