import type { AppContext } from "./app-context.js";
import type { InitOptions } from "./init.js";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  detectPackageManager,
  nextInstallCommand,
  NUVIO_NEXT_VERSION,
} from "./detect-pm.js";
import {
  nextPackagesNeedInstall,
  runNextInstall,
} from "./install-packages.js";
import { findNextConfig, patchNextConfigFile } from "./patch-next-config.js";
import {
  patchNextLayoutFile,
  resolveNextLayoutFile,
} from "./patch-next-layout.js";
import {
  ensureNextPagesApp,
  resolveNextPagesAppFile,
} from "./patch-next-pages-app.js";
import {
  ensureNextServerJs,
  patchPackageJsonDevScript,
} from "./patch-next-server.js";
import { patchStarterId } from "./patch-starter-id.js";
import { projectHasPageTitleId } from "./scan-ids.js";
import { createPlan, type InitPlan, type ResultTier } from "./plan.js";
import { MSG } from "./messages.js";
import { NUVIO_VERSION } from "./version.js";
import { writeNuvioFolder } from "./write-nuvio-folder.js";
import { printNextVerification, verifyNextProject } from "./verify-next.js";
import { buildAppTelemetryProps, captureCliEvent } from "./telemetry.js";

type NextInitChecks = {
  install: boolean;
  config: boolean;
  server: boolean;
  shell: boolean;
  starter: boolean;
  starterFile?: string;
};

function computeNextTier(checks: NextInitChecks): ResultTier {
  if (!checks.install || !checks.shell) {
    return "failed";
  }
  if (!checks.config || !checks.server || !checks.starter) {
    return "partial";
  }
  return "full";
}

function printNextSuccess(plan: InitPlan, checks: NextInitChecks): void {
  if (checks.install) {
    console.log(
      `✅ nuvio packages targeted (@nuvio/next@${NUVIO_NEXT_VERSION}, @nuvio/overlay@${NUVIO_VERSION})`,
    );
  }
  if (checks.config) {
    console.log("✅ next.config wrapped with withNuvio()");
  } else {
    console.log("⚠ next.config — see nuvio/SETUP_TODO.md");
  }
  if (checks.server) {
    console.log("✅ server.js dev entry with Nuvio");
  } else {
    console.log("⚠ server.js — see nuvio/SETUP_TODO.md");
  }
  if (checks.shell) {
    console.log("✅ NuvioNextShell mounted");
  } else {
    console.log("⚠ App shell — see nuvio/SETUP_TODO.md");
  }
  if (checks.starter) {
    console.log(
      `✅ Starter editable area: page.title${checks.starterFile ? ` (${checks.starterFile})` : ""}`,
    );
  } else {
    console.log(`⚠ ${MSG.noHeading}`);
  }
  console.log("✅ Start here: nuvio/START_HERE.md");
  console.log("✅ Agent guide: nuvio/AGENT.md");
  console.log(`\nNext:\n  ${plan.pmRun}\n`);
  console.log("Open localhost → Edit on → click the starter element.");
  if (plan.tier === "partial") {
    console.log(`\n${MSG.partialHelp}`);
  }
  console.log(`\n${MSG.telemetryNotice}`);
}

async function confirmNext(plan: InitPlan): Promise<boolean> {
  const { createInterface } = await import("node:readline");
  console.log("\nPlanned changes:");
  for (const f of plan.modify) console.log(`  modify: ${f}`);
  for (const f of plan.create) console.log(`  create: ${f}`);
  if (plan.warnings.length) {
    console.log("\nWarnings:");
    for (const w of plan.warnings) console.log(`  ⚠ ${w}`);
  }
  console.log(`\nInstall: ${plan.installCommand || "(skip)"}`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("\nProceed? [y/N] ", (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

function isAutoYes(opts: InitOptions): boolean {
  if (opts.yes) return true;
  if (process.env.CI === "true") return true;
  return !process.stdin.isTTY;
}

export async function runInitNext(
  opts: InitOptions,
  app: AppContext,
): Promise<number> {
  const root = app.appRoot;
  const pm = detectPackageManager(root, opts.pm);
  const telemetryBase = buildAppTelemetryProps(pm, app);

  if (!opts.dryRun) {
    captureCliEvent("nuvio_init_started", telemetryBase);
  }

  const plan = createPlan(root, pm);
  plan.installCommand = opts.noInstall
    ? "(skipped — --no-install)"
    : nextInstallCommand(pm, NUVIO_VERSION, NUVIO_NEXT_VERSION);

  if (!app.tailwindOk && !opts.skipTailwindCheck) {
    const msg =
      "Tailwind CSS not detected. Class/style edits may not work until Tailwind is installed.";
    if (opts.strict) {
      console.error(MSG.strictTailwind);
      captureCliEvent("nuvio_init_failed", {
        ...telemetryBase,
        error_code: "strict_tailwind",
      });
      return 1;
    }
    plan.warnings.push(msg);
  }

  const configPath = findNextConfig(root);
  if (configPath) {
    plan.modify.push(configPath.replace(`${root}/`, ""));
  }

  const usesPages =
    app.router === "pages" || app.router === "mixed";
  const usesApp =
    app.router === "app" || app.router === "mixed" || app.router === "none";

  if (usesApp) {
    const layout = resolveNextLayoutFile(root);
    if (layout) {
      plan.modify.push(layout.replace(`${root}/`, ""));
    } else if (!usesPages) {
      plan.warnings.push("No app/layout.tsx found — add NuvioNextShell manually");
    }
  }

  if (usesPages) {
    const pagesApp = resolveNextPagesAppFile(root);
    if (pagesApp) {
      plan.modify.push(pagesApp.replace(`${root}/`, ""));
    } else {
      plan.create.push(defaultPagesAppRel(root));
    }
  }

  plan.create.push("server.js");
  plan.modify.push("package.json");
  plan.create.push("nuvio/START_HERE.md", "nuvio/README.md", "nuvio/AGENT.md");

  if (opts.dryRun) {
    console.log("Dry run — no files changed.\n");
    for (const f of plan.modify) console.log(`  would modify: ${f}`);
    for (const f of plan.create) console.log(`  would create: ${f}`);
    if (plan.warnings.length) {
      for (const w of plan.warnings) console.log(`  would warn: ${w}`);
    }
    console.log(`  would run: ${plan.installCommand}`);
    return 0;
  }

  if (!isAutoYes(opts)) {
    const ok = await confirmNext(plan);
    if (!ok) {
      captureCliEvent("nuvio_init_failed", {
        ...telemetryBase,
        error_code: "user_cancelled",
      });
      return 1;
    }
  }

  let installOk = true;
  if (!opts.noInstall) {
    if (
      nextPackagesNeedInstall(
        app.packageJsonPath,
        NUVIO_VERSION,
        NUVIO_NEXT_VERSION,
      )
    ) {
      const result = runNextInstall(root, pm, NUVIO_VERSION, NUVIO_NEXT_VERSION);
      if (!result.ok) {
        console.error(result.message ?? "Install failed.");
        captureCliEvent("nuvio_init_failed", {
          ...telemetryBase,
          error_code: "install_failed",
        });
        return 1;
      }
    } else {
      console.log("✅ nuvio packages already installed");
    }
  } else {
    console.log("(skipped install — --no-install)");
  }

  let configOk = false;
  if (configPath) {
    const result = patchNextConfigFile(configPath);
    configOk = result.ok;
    if (!result.ok) {
      plan.failedSteps.push(`next.config (${result.error ?? "unknown"})`);
    }
  } else {
    plan.failedSteps.push("next.config (not found)");
  }

  let shellOk = false;
  if (usesApp) {
    const layout = resolveNextLayoutFile(root);
    if (layout) {
      const result = patchNextLayoutFile(layout);
      shellOk = result.ok || shellOk;
      if (!result.ok) {
        plan.failedSteps.push(`layout (${result.error ?? "unknown"})`);
      }
    }
  }
  if (usesPages) {
    const { outcome, filePath } = ensureNextPagesApp(root);
    shellOk = outcome.ok || shellOk;
    if (!outcome.ok) {
      plan.failedSteps.push(`pages/_app (${outcome.error ?? "unknown"})`);
    } else {
      plan.modify.push(filePath.replace(`${root}/`, ""));
    }
  }

  const serverResult = ensureNextServerJs(root);
  const serverOk = serverResult.outcome.ok;
  const devScriptOk = patchPackageJsonDevScript(root).ok;

  let starterOk = false;
  let starterFile: string | undefined;
  if (!projectHasPageTitleId(root)) {
    const { outcome, file } = patchStarterId(root);
    if (outcome.ok) {
      starterOk = true;
      starterFile = file?.replace(`${root}/`, "");
    } else {
      plan.warnings.push(MSG.noHeading);
    }
  } else {
    starterOk = true;
    console.log("✅ Starter id page.title already present");
  }

  writeNuvioFolder({
    root,
    version: NUVIO_VERSION,
    pmRun: plan.pmRun,
    failedSteps: plan.failedSteps,
    forceAgent: opts.forceAgent,
  });

  const checks: NextInitChecks = {
    install: installOk,
    config: configOk,
    server: serverOk && devScriptOk,
    shell: shellOk,
    starter: starterOk,
    starterFile,
  };
  plan.tier = computeNextTier(checks);

  console.log("");
  printNextSuccess(plan, checks);

  const verification = verifyNextProject(
    root,
    app.packageJsonPath,
    app.router,
  );
  printNextVerification(verification);

  if (plan.tier === "failed") {
    captureCliEvent("nuvio_init_failed", {
      ...telemetryBase,
      error_code: "init_tier_failed",
      result_tier: "failed",
    });
    return 1;
  }
  captureCliEvent("nuvio_init_completed", {
    ...telemetryBase,
    result_tier: plan.tier,
  });
  return 0;
}

function defaultPagesAppRel(root: string): string {
  if (existsSync(join(root, "src/pages"))) {
    return "src/pages/_app.tsx";
  }
  return "pages/_app.tsx";
}
