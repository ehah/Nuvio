import { resolve } from "node:path";
import { runBrandApply } from "./brand-apply.js";
import { runBrandScan } from "./brand-scan.js";
import { runCoverageVerify } from "./coverage-verify.js";
import { runDoctor } from "./doctor.js";
import { runInit, type InitOptions } from "./init.js";
import { runScan } from "./scan-cmd.js";
import { runStats } from "./stats.js";
import type { PackageManager } from "./detect-pm.js";
import {
  buildCliTelemetryProps,
  captureCliEvent,
  captureCliInvoked,
  registerTelemetrySignalHandlers,
  resolveCliInvokedCommand,
  shutdownTelemetry,
} from "./telemetry.js";
import { detectPackageManager } from "./detect-pm.js";

export type CommonCliOptions = {
  cwd: string;
  app?: string;
  allApps?: boolean;
  json?: boolean;
  verbose?: boolean;
};

export type DoctorCliOptions = CommonCliOptions & {
  skipDevServer?: boolean;
};

function printHelp(): void {
  console.log(`nuvio — CLI for React frontends (Vite + Next.js)

Usage:
  nuvio init [options]
  nuvio doctor [options]
  nuvio scan [options]
  nuvio stats [options]
  nuvio coverage verify [options]
  nuvio brand scan [options]
  nuvio brand apply [options]

Common options:
  --cwd <path>          Repo or app root (default: current directory)
  --app <id>            Frontend app id (e.g. apps/next-dogfood, frontend)
  --all-apps            Run against every detected frontend app
  --json                Machine-readable output (doctor, scan, stats)
  --verbose             Show error stacks
  -h, --help            Show help

Init options:
  --yes                 Skip confirmation
  --no-install          Patch files only; do not run package manager install
  --dry-run             Show plan only (still prompts unless --yes / CI)
  --pm <pnpm|npm|yarn|bun>  Force package manager
  --strict              Fail if Tailwind is not detected
  --skip-tailwind-check Do not warn when Tailwind is missing
  --force-agent         Overwrite nuvio/AGENT.md

Doctor options:
  --skip-dev-server     Skip localhost dev-server health check

Coverage verify options:
  --page <slug>         Page slug (loads nuvio/pages/<slug>.pcc.yaml)
  --manifest <path>     Explicit PCC manifest path (overrides --page)
  --all                 Verify every manifest in nuvio/pages/

Brand scan options:
  --page <slug>         Page slug (loads nuvio/pages/<slug>.pcc.yaml)
  --manifest <path>     Explicit PCC manifest path (overrides --page)
  --all                 Scan every manifest in nuvio/pages/

Brand apply options:
  --page <slug>         Page slug (loads nuvio/pages/<slug>.pcc.yaml)
  --manifest <path>     Explicit PCC manifest path (overrides --page)
  --all                 Apply to every manifest in nuvio/pages/
  --dry-run             Report targets without writing source files

Examples:
  pnpm dlx @nuvio/cli init --yes
  pnpm dlx @nuvio/cli doctor
  pnpm dlx @nuvio/cli scan --app next-dogfood --cwd .
  pnpm dlx @nuvio/cli doctor --all-apps --cwd .
  pnpm dlx @nuvio/cli stats
  pnpm dlx @nuvio/cli coverage verify --page dashboard --cwd apps/tailadmin-dogfood
  pnpm dlx @nuvio/cli coverage verify --all --cwd apps/tailadmin-dogfood
  pnpm dlx @nuvio/cli brand scan --page dashboard --cwd apps/tailadmin-dogfood
  pnpm dlx @nuvio/cli brand scan --all --cwd apps/tailadmin-dogfood
  pnpm dlx @nuvio/cli brand apply --all --cwd apps/tailadmin-dogfood
`);
}

function parseInitArgs(argv: string[]): {
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
    }     else if (arg === "--cwd") {
      opts.cwd = resolve(args[++i] ?? ".");
    } else if (arg === "--app") {
      opts.app = args[++i] ?? "";
    } else if (arg === "--all-apps") {
      opts.allApps = true;
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      help = true;
    }
  }

  return { command, opts, help };
}

function parseProjectCommandArgs(
  argv: string[],
  command: string,
): {
  command: string;
  common: CommonCliOptions;
  doctor: DoctorCliOptions;
  help: boolean;
} {
  const args = argv.slice(2);
  const common: CommonCliOptions = { cwd: process.cwd() };
  const doctor: DoctorCliOptions = { ...common };
  let help = false;
  let i = args[0] === command ? 1 : 0;

  for (; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }
    if (arg === "--json") {
      common.json = true;
      doctor.json = true;
    } else if (arg === "--verbose") {
      common.verbose = true;
      doctor.verbose = true;
    } else if (arg === "--cwd") {
      const cwd = resolve(args[++i] ?? ".");
      common.cwd = cwd;
      doctor.cwd = cwd;
    } else if (arg === "--app") {
      const app = args[++i] ?? "";
      common.app = app;
      doctor.app = app;
    } else if (arg === "--all-apps") {
      common.allApps = true;
      doctor.allApps = true;
    } else if (arg === "--skip-dev-server") {
      doctor.skipDevServer = true;
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      help = true;
    }
  }

  return { command, common, doctor, help };
}

function parseCoverageVerifyArgs(argv: string[]): {
  command: string;
  subcommand: string;
  common: CommonCliOptions;
  page?: string;
  manifest?: string;
  all?: boolean;
  help: boolean;
} {
  const args = argv.slice(2);
  const common: CommonCliOptions = { cwd: process.cwd() };
  let help = false;
  let page: string | undefined;
  let manifest: string | undefined;
  let all = false;
  let i = 0;

  if (args[0] === "coverage") {
    i = 1;
  }
  const subcommand = args[i] === "verify" ? "verify" : "";
  if (subcommand) {
    i += 1;
  }

  for (; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }
    if (arg === "--json") {
      common.json = true;
    } else if (arg === "--verbose") {
      common.verbose = true;
    } else if (arg === "--cwd") {
      common.cwd = resolve(args[++i] ?? ".");
    } else if (arg === "--app") {
      common.app = args[++i] ?? "";
    } else if (arg === "--all-apps") {
      common.allApps = true;
    } else if (arg === "--page") {
      page = args[++i];
    } else if (arg === "--manifest") {
      manifest = resolve(args[++i] ?? "");
    } else if (arg === "--all") {
      all = true;
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      help = true;
    }
  }

  return { command: "coverage", subcommand, common, page, manifest, all, help };
}

function parseBrandArgs(argv: string[]): {
  command: string;
  subcommand: "scan" | "apply" | "";
  common: CommonCliOptions;
  page?: string;
  manifest?: string;
  all?: boolean;
  dryRun?: boolean;
  help: boolean;
} {
  const args = argv.slice(2);
  const common: CommonCliOptions = { cwd: process.cwd() };
  let help = false;
  let page: string | undefined;
  let manifest: string | undefined;
  let all = false;
  let dryRun = false;
  let i = 0;

  if (args[0] === "brand") {
    i = 1;
  }
  const subArg = args[i];
  const subcommand = subArg === "scan" || subArg === "apply" ? subArg : "";
  if (subcommand) {
    i += 1;
  }

  for (; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      help = true;
      continue;
    }
    if (arg === "--json") {
      common.json = true;
    } else if (arg === "--verbose") {
      common.verbose = true;
    } else if (arg === "--cwd") {
      common.cwd = resolve(args[++i] ?? ".");
    } else if (arg === "--app") {
      common.app = args[++i] ?? "";
    } else if (arg === "--all-apps") {
      common.allApps = true;
    } else if (arg === "--page") {
      page = args[++i];
    } else if (arg === "--manifest") {
      manifest = resolve(args[++i] ?? "");
    } else if (arg === "--all") {
      all = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      help = true;
    }
  }

  return { command: "brand", subcommand, common, page, manifest, all, dryRun, help };
}

export async function runCli(argv: string[]): Promise<number> {
  registerTelemetrySignalHandlers();
  const rawCommand = argv[2] ?? null;
  const isCoverageCmd = rawCommand === "coverage";
  const isBrandCmd = rawCommand === "brand";
  const isProjectCmd =
    rawCommand === "doctor" ||
    rawCommand === "scan" ||
    rawCommand === "stats" ||
    isCoverageCmd ||
    isBrandCmd;

  let help = false;
  let command: string | null = rawCommand;
  let initOpts: InitOptions = { cwd: process.cwd() };
  let commonOpts: CommonCliOptions = { cwd: process.cwd() };
  let doctorOpts: DoctorCliOptions = { cwd: process.cwd() };
  let coverageOpts: ReturnType<typeof parseCoverageVerifyArgs> | null = null;
  let brandOpts: ReturnType<typeof parseBrandArgs> | null = null;

  if (isBrandCmd) {
    brandOpts = parseBrandArgs(argv);
    help = brandOpts.help;
    command = brandOpts.command;
    commonOpts = brandOpts.common;
  } else if (isCoverageCmd) {
    coverageOpts = parseCoverageVerifyArgs(argv);
    help = coverageOpts.help;
    command = coverageOpts.command;
    commonOpts = coverageOpts.common;
  } else if (isProjectCmd) {
    const parsed = parseProjectCommandArgs(argv, rawCommand!);
    help = parsed.help;
    command = parsed.command;
    commonOpts = parsed.common;
    doctorOpts = parsed.doctor;
  } else {
    const parsed = parseInitArgs(argv);
    help = parsed.help;
    command = parsed.command;
    initOpts = parsed.opts;
  }

  const cwd =
    isProjectCmd ? commonOpts.cwd : initOpts.cwd;
  captureCliInvoked(
    resolveCliInvokedCommand(help, command),
    isProjectCmd ? undefined : initOpts.pm,
  );

  try {
    if (help) {
      printHelp();
      return 0;
    }
    if (!command) {
      printHelp();
      return 1;
    }

    switch (command) {
      case "init":
        return await runInit(initOpts);
      case "doctor":
        return await runDoctor({
          cwd: doctorOpts.cwd,
          app: doctorOpts.app,
          allApps: doctorOpts.allApps,
          json: doctorOpts.json,
          checkDevServer: !doctorOpts.skipDevServer,
        });
      case "scan":
        return runScan({
          cwd: commonOpts.cwd,
          app: commonOpts.app,
          allApps: commonOpts.allApps,
          json: commonOpts.json,
        });
      case "stats":
        return runStats({
          cwd: commonOpts.cwd,
          app: commonOpts.app,
          allApps: commonOpts.allApps,
          json: commonOpts.json,
        });
      case "coverage": {
        if (!coverageOpts || coverageOpts.subcommand !== "verify") {
          console.error("Usage: nuvio coverage verify --page <slug>");
          printHelp();
          return 1;
        }
        if (!coverageOpts.page && !coverageOpts.manifest && !coverageOpts.all) {
          console.error("Either --page, --manifest, or --all is required");
          return 2;
        }
        return runCoverageVerify({
          cwd: coverageOpts.common.cwd,
          app: coverageOpts.common.app,
          allApps: coverageOpts.common.allApps,
          page: coverageOpts.page,
          manifest: coverageOpts.manifest,
          all: coverageOpts.all,
          json: coverageOpts.common.json,
        });
      }
      case "brand": {
        if (!brandOpts || (brandOpts.subcommand !== "scan" && brandOpts.subcommand !== "apply")) {
          console.error("Usage: nuvio brand scan|apply --page <slug>");
          printHelp();
          return 1;
        }
        if (!brandOpts.page && !brandOpts.manifest && !brandOpts.all) {
          console.error("Either --page, --manifest, or --all is required");
          return 2;
        }
        if (brandOpts.subcommand === "scan") {
          return runBrandScan({
            cwd: brandOpts.common.cwd,
            app: brandOpts.common.app,
            allApps: brandOpts.common.allApps,
            page: brandOpts.page,
            manifest: brandOpts.manifest,
            all: brandOpts.all,
            json: brandOpts.common.json,
          });
        }
        return runBrandApply({
          cwd: brandOpts.common.cwd,
          app: brandOpts.common.app,
          allApps: brandOpts.common.allApps,
          page: brandOpts.page,
          manifest: brandOpts.manifest,
          all: brandOpts.all,
          dryRun: brandOpts.dryRun,
          json: brandOpts.common.json,
        });
      }
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        return 1;
    }
  } catch (e) {
    const pm = detectPackageManager(cwd, initOpts.pm);
    captureCliEvent("nuvio_init_failed", {
      ...buildCliTelemetryProps(pm),
      error_code: "unexpected_error",
    });
    const verbose = isProjectCmd ? commonOpts.verbose : initOpts.verbose;
    if (verbose) console.error(e);
    else console.error("Something went wrong. Run with --verbose for details.");
    return 2;
  } finally {
    await shutdownTelemetry();
  }
}
