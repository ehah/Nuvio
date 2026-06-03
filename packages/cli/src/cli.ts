import { resolve } from "node:path";
import { runInit, type InitOptions } from "./init.js";
import type { PackageManager } from "./detect-pm.js";

function printHelp(): void {
  console.log(`nuvio — Nuvio CLI

Usage:
  nuvio init [options]

Options:
  --yes                 Skip confirmation
  --no-install          Patch files only; do not run package manager install
  --dry-run             Show plan only (still prompts unless --yes / CI)
  --pm <pnpm|npm|yarn|bun>  Force package manager
  --strict              Fail if Tailwind is not detected
  --skip-tailwind-check Do not warn when Tailwind is missing
  --force-agent         Overwrite nuvio/AGENT.md
  --cwd <path>          Project root (default: current directory)
  --verbose             Show error stacks
  -h, --help            Show help

Example:
  pnpm dlx @nuvio/cli init
  pnpm dlx @nuvio/cli init --yes
`);
}

function parseArgs(argv: string[]): {
  command: string | null;
  opts: InitOptions;
  help: boolean;
} {
  const args = argv.slice(2);
  let command: string | null = null;
  const opts: InitOptions = { cwd: process.cwd() };
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }
    if (!command && !arg.startsWith("-")) {
      command = arg;
      continue;
    }
    if (arg === "--yes") opts.yes = true;
    else if (arg === "--no-install") opts.noInstall = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--strict") opts.strict = true;
    else if (arg === "--skip-tailwind-check") opts.skipTailwindCheck = true;
    else if (arg === "--force-agent") opts.forceAgent = true;
    else if (arg === "--verbose") opts.verbose = true;
    else if (arg === "--pm") {
      opts.pm = args[++i] as PackageManager;
    } else if (arg === "--cwd") {
      opts.cwd = resolve(args[++i] ?? ".");
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      help = true;
    }
  }

  return { command, opts, help };
}

export async function runCli(argv: string[]): Promise<number> {
  const { command, opts, help } = parseArgs(argv);

  if (help) {
    printHelp();
    return 0;
  }
  if (!command) {
    printHelp();
    return 1;
  }

  if (command !== "init") {
    console.error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  }

  try {
    return await runInit(opts);
  } catch (e) {
    if (opts.verbose) console.error(e);
    else console.error("Something went wrong. Run with --verbose for details.");
    return 2;
  }
}
