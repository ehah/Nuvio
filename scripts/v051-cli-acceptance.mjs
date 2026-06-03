#!/usr/bin/env node
/**
 * v0.5.1 CLI acceptance — run init on fixture, assert wiring.
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = join(root, "packages/cli/test/fixtures/vite-react-ts-minimal");
const cliEntry = join(root, "packages/cli/dist/cli-entry.js");

function fail(msg) {
  console.error(`v051:acceptance FAIL — ${msg}`);
  process.exit(1);
}

const build = spawnSync("pnpm", ["--filter", "@nuvio/cli", "build"], {
  cwd: root,
  stdio: "inherit",
});
if (build.status !== 0) fail("cli build failed");
if (!existsSync(cliEntry)) fail("missing packages/cli/dist/cli-entry.js");

const work = mkdtempSync(join(tmpdir(), "nuvio-v051-"));
try {
  cpSync(fixture, work, { recursive: true });
  const run = spawnSync(
    process.execPath,
    [cliEntry, "init", "--yes", "--no-install"],
    { cwd: work, stdio: "inherit", env: { ...process.env, CI: "true" } },
  );
  if (run.status !== 0) fail(`init exited ${run.status}`);

  const vite = readFileSync(join(work, "vite.config.ts"), "utf8");
  const app = readFileSync(join(work, "src/App.tsx"), "utf8");
  if (!vite.includes("nuvio()")) fail("vite.config missing nuvio()");
  if (!app.includes("NuvioDevShell")) fail("App missing NuvioDevShell");
  if (!app.includes('data-nuvio-id="page.title"'))
    fail("App missing page.title id");
  if (!existsSync(join(work, "nuvio/START_HERE.md")))
    fail("missing nuvio/START_HERE.md");
  if (!existsSync(join(work, "nuvio/AGENT.md")))
    fail("missing nuvio/AGENT.md");

  const run2 = spawnSync(
    process.execPath,
    [cliEntry, "init", "--yes", "--no-install"],
    { cwd: work, stdio: "pipe", env: { ...process.env, CI: "true" } },
  );
  if (run2.status !== 0) fail(`second init exited ${run2.status}`);
  if (readFileSync(join(work, "vite.config.ts"), "utf8") !== vite)
    fail("second init changed vite.config");
  if (readFileSync(join(work, "src/App.tsx"), "utf8") !== app)
    fail("second init changed App.tsx");

  console.log("v051:acceptance PASS");
} finally {
  rmSync(work, { recursive: true, force: true });
}
