import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Package root (works from `src/` in dev and `dist/` when published). */
const CLI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadTemplate(name: string): string {
  return readFileSync(join(CLI_ROOT, "templates", name), "utf8");
}

function render(tpl: string, vars: Record<string, string>): string {
  let out = tpl;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

export type WriteFolderOptions = {
  root: string;
  version: string;
  pmRun: string;
  failedSteps: string[];
  forceAgent?: boolean;
};

export function writeNuvioFolder(opts: WriteFolderOptions): string[] {
  const dir = join(opts.root, "nuvio");
  const created: string[] = [];
  mkdirSync(dir, { recursive: true });

  const vars = {
    NUVIO_VERSION: opts.version,
    PM_RUN: opts.pmRun,
    FAILED_STEPS: opts.failedSteps.join(", ") || "(none)",
  };

  const startHere = join(dir, "START_HERE.md");
  writeFileSync(
    startHere,
    render(loadTemplate("START_HERE.md.tpl"), vars),
    "utf8",
  );
  created.push("nuvio/START_HERE.md");

  const readme = join(dir, "README.md");
  writeFileSync(
    readme,
    render(loadTemplate("README.pointer.md.tpl"), vars),
    "utf8",
  );
  created.push("nuvio/README.md");

  const agent = join(dir, "AGENT.md");
  if (!existsSync(agent) || opts.forceAgent) {
    writeFileSync(agent, render(loadTemplate("AGENT.md.tpl"), vars), "utf8");
    created.push("nuvio/AGENT.md");
  }

  if (opts.failedSteps.length > 0) {
    const todo = join(dir, "SETUP_TODO.md");
    writeFileSync(
      todo,
      render(loadTemplate("SETUP_TODO.md.tpl"), vars),
      "utf8",
    );
    created.push("nuvio/SETUP_TODO.md");
  }

  return created;
}
