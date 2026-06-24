import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatFrameworkLabel,
  resolveTargetApps,
  type AppContext,
} from "./app-context.js";
import { detectPackageManager } from "./detect-pm.js";
import { PreflightError, detectProject } from "./detect-project.js";
import { nuvioOverlayLinkKind } from "./nuvio-deps.js";
import { scanAppContext, scanProject } from "./project-scan.js";
import {
  buildAppTelemetryProps,
  buildCliTelemetryProps,
  captureCliEvent,
  type DoctorRunTelemetry,
} from "./telemetry.js";
import { findNextConfig } from "./patch-next-config.js";
import { layoutHasNuvioShell, resolveNextLayoutFile } from "./patch-next-layout.js";
import { nextServerPath } from "./patch-next-server.js";
import { nextConfigHasWithNuvio } from "./verify-next.js";
import { verifyProject } from "./verify.js";

export type DoctorCheckStatus = "pass" | "warn" | "fail";

export type DoctorCheck = {
  id: string;
  label: string;
  status: DoctorCheckStatus;
  detail?: string;
};

export type DoctorResult = {
  appId: string;
  framework: string;
  projectName: string;
  checks: DoctorCheck[];
  passCount: number;
  warnCount: number;
  failCount: number;
};

export type DoctorOptions = {
  cwd: string;
  app?: string;
  allApps?: boolean;
  json?: boolean;
  checkDevServer?: boolean;
  devServerPort?: number;
};

function hasPackage(pkg: Record<string, unknown>, name: string): boolean {
  const sections = ["dependencies", "devDependencies", "peerDependencies"] as const;
  for (const key of sections) {
    const deps = pkg[key];
    if (deps && typeof deps === "object" && name in (deps as Record<string, unknown>)) {
      return true;
    }
  }
  return false;
}

async function checkDevServerReachable(port: number): Promise<DoctorCheck> {
  const url = `http://127.0.0.1:${port}/`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1_500) });
    if (res.ok) {
      return {
        id: "dev_server",
        label: `Dev server reachable (${url})`,
        status: "pass",
      };
    }
    return {
      id: "dev_server",
      label: "Dev server reachable",
      status: "warn",
      detail: `HTTP ${res.status} from ${url}`,
    };
  } catch {
    return {
      id: "dev_server",
      label: "Dev server reachable",
      status: "warn",
      detail: `Start dev server — could not reach ${url}`,
    };
  }
}

function summarize(result: DoctorResult): void {
  const total = result.checks.length;
  const passed = result.passCount;
  const label =
    result.failCount > 0
      ? "nuvio not ready"
      : result.warnCount > 0
        ? "nuvio partially ready"
        : "nuvio ready";
  console.log(`\nResult: ${passed}/${total} passed — ${label}`);
}

function fileHasUseClient(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return false;
  }
  const head = readFileSync(filePath, "utf8").slice(0, 200);
  return /^["']use client["'];?\s*$/m.test(head);
}

function projectHasNextShell(appRoot: string): boolean {
  const candidates = [
    "src/components/nuvio/NuvioNextShell.tsx",
    "components/nuvio/NuvioNextShell.tsx",
    "app/nuvio-shell.tsx",
    "src/components/NuvioClient.tsx",
  ];
  for (const rel of candidates) {
    const file = join(appRoot, rel);
    if (!existsSync(file)) {
      continue;
    }
    const text = readFileSync(file, "utf8");
    if (/NuvioNextShell|NuvioDevShell/.test(text) && fileHasUseClient(file)) {
      return true;
    }
  }
  const layoutCandidates = ["src/app/layout.tsx", "app/layout.tsx"];
  for (const rel of layoutCandidates) {
    const file = join(appRoot, rel);
    if (!existsSync(file)) {
      continue;
    }
    const text = readFileSync(file, "utf8");
    if (/NuvioNextShell|@nuvio\/overlay\/next/.test(text)) {
      return true;
    }
  }
  return false;
}

async function runDoctorForViteApp(
  app: AppContext,
  opts: DoctorOptions,
): Promise<{ result: DoctorResult; exit: number }> {
  const scan = scanProject(app.appRoot);
  const { ctx, detectedLibraries, index } = scan;
  const pkg = ctx.packageJson;
  const projectName = String(pkg.name ?? "project");
  const verification = verifyProject(
    ctx.root,
    ctx.packageJsonPath,
    ctx.viteConfigPath,
  );

  const checks: DoctorCheck[] = [
    {
      id: "deps_plugin",
      label: "@nuvio/vite-plugin installed",
      status: verification.deps === "OK" ? "pass" : "fail",
    },
    {
      id: "deps_overlay",
      label: "@nuvio/overlay installed",
      status: verification.deps === "OK" ? "pass" : "fail",
    },
    {
      id: "vite_plugin",
      label: "vite.config contains nuvio()",
      status: verification.vite === "OK" ? "pass" : "fail",
    },
    {
      id: "optimize_deps",
      label: "optimizeDeps.exclude includes @nuvio/overlay",
      status: verification.optimizeDeps === "OK" ? "pass" : "fail",
      detail:
        verification.optimizeDeps === "OK" &&
        nuvioOverlayLinkKind(pkg) === "workspace"
          ? "workspace install — optional"
          : undefined,
    },
    {
      id: "overlay_css",
      label: "main entry imports @nuvio/overlay/style.css",
      status: verification.overlayCss === "OK" ? "pass" : "fail",
      detail:
        verification.overlayCss === "OK" &&
        nuvioOverlayLinkKind(pkg) === "workspace"
          ? "workspace install — optional"
          : undefined,
    },
    {
      id: "dev_shell",
      label: "NuvioDevShell mounted in app",
      status: verification.shell === "OK" ? "pass" : "fail",
    },
    {
      id: "tailwind",
      label: "Tailwind detected",
      status: ctx.tailwindOk ? "pass" : "warn",
      detail: ctx.tailwindOk
        ? undefined
        : "Style edits may not apply visually without Tailwind",
    },
    {
      id: "editable_hosts",
      label: "At least one data-nuvio-id indexed",
      status: index.entries.length > 0 ? "pass" : "fail",
      detail:
        index.entries.length > 0
          ? `${index.entries.length} host(s)`
          : "Run dev → Make Editable, or add ids manually",
    },
  ];

  if (detectedLibraries.length > 0) {
    checks.push({
      id: "libraries",
      label: "Component libraries detected",
      status: "pass",
      detail: detectedLibraries.join(", "),
    });
  }

  if (index.duplicateErrors.length > 0) {
    checks.push({
      id: "duplicate_ids",
      label: "No duplicate data-nuvio-id values",
      status: "fail",
      detail: `${index.duplicateErrors.length} duplicate id(s) — run nuvio scan`,
    });
  } else {
    checks.push({
      id: "duplicate_ids",
      label: "No duplicate data-nuvio-id values",
      status: "pass",
    });
  }

  if (opts.checkDevServer !== false) {
    checks.push(
      await checkDevServerReachable(opts.devServerPort ?? app.devServerPort),
    );
  }

  return buildDoctorResult(app, projectName, checks);
}

async function runDoctorForNextApp(
  app: AppContext,
  opts: DoctorOptions,
): Promise<{ result: DoctorResult; exit: number }> {
  const { detectedLibraries, index } = scanAppContext(app);
  const pkg = app.packageJson;
  const projectName = String(pkg.name ?? app.appId);
  const hasNext = hasPackage(pkg, "@nuvio/next");
  const hasOverlay = hasPackage(pkg, "@nuvio/overlay");
  const configPath = findNextConfig(app.appRoot);
  const hasWithNuvio = configPath ? nextConfigHasWithNuvio(configPath) : false;
  const serverPath = nextServerPath(app.appRoot);
  const hasNuvioServer =
    existsSync(serverPath) &&
    readFileSync(serverPath, "utf8").includes("Nuvio");
  const layout = resolveNextLayoutFile(app.appRoot);
  const shellMounted =
    (layout ? layoutHasNuvioShell(layout) : false) ||
    projectHasNextShell(app.appRoot);

  const checks: DoctorCheck[] = [
    {
      id: "deps_next",
      label: "@nuvio/next installed",
      status: hasNext ? "pass" : "fail",
    },
    {
      id: "deps_overlay",
      label: "@nuvio/overlay installed",
      status: hasOverlay ? "pass" : "fail",
    },
    {
      id: "next_config",
      label: "next.config uses withNuvio()",
      status: hasWithNuvio ? "pass" : "warn",
      detail: hasWithNuvio ? undefined : "Required for click-to-tag in dev",
    },
    {
      id: "dev_server_entry",
      label: "server.js uses Nuvio dev server",
      status: hasNuvioServer ? "pass" : "warn",
      detail: hasNuvioServer
        ? undefined
        : "Run nuvio init or add createNuvioNextDevServer to server.js",
    },
    {
      id: "dev_shell",
      label: "NuvioNextShell mounted",
      status: shellMounted ? "pass" : "fail",
    },
    {
      id: "tailwind",
      label: "Tailwind detected",
      status: app.tailwindOk ? "pass" : "warn",
      detail: app.tailwindOk
        ? undefined
        : "Style edits may not apply visually without Tailwind",
    },
    {
      id: "editable_hosts",
      label: "At least one data-nuvio-id indexed",
      status: index.entries.length > 0 ? "pass" : "fail",
      detail:
        index.entries.length > 0
          ? `${index.entries.length} host(s)`
          : "Add data-nuvio-id or use Make Editable in dev",
    },
  ];

  if (detectedLibraries.length > 0) {
    checks.push({
      id: "libraries",
      label: "Component libraries detected",
      status: "pass",
      detail: detectedLibraries.join(", "),
    });
  }

  if (index.duplicateErrors.length > 0) {
    checks.push({
      id: "duplicate_ids",
      label: "No duplicate data-nuvio-id values",
      status: "fail",
      detail: `${index.duplicateErrors.length} duplicate id(s) — run nuvio scan`,
    });
  } else {
    checks.push({
      id: "duplicate_ids",
      label: "No duplicate data-nuvio-id values",
      status: "pass",
    });
  }

  if (opts.checkDevServer !== false) {
    checks.push(
      await checkDevServerReachable(opts.devServerPort ?? app.devServerPort),
    );
  }

  return buildDoctorResult(app, projectName, checks);
}

function buildDoctorResult(
  app: AppContext,
  projectName: string,
  checks: DoctorCheck[],
): { result: DoctorResult; exit: number } {
  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;

  const result: DoctorResult = {
    appId: app.appId,
    framework: app.framework,
    projectName,
    checks,
    passCount,
    warnCount,
    failCount,
  };

  return { result, exit: failCount > 0 ? 1 : 0 };
}

async function runDoctorForApp(
  app: AppContext,
  opts: DoctorOptions,
): Promise<{ result: DoctorResult; exit: number }> {
  if (app.framework === "vite") {
    return runDoctorForViteApp(app, opts);
  }
  if (app.framework.startsWith("next")) {
    return runDoctorForNextApp(app, opts);
  }
  const { index } = scanAppContext(app);
  return buildDoctorResult(app, String(app.packageJson.name ?? app.appId), [
    {
      id: "framework",
      label: "Supported framework (Vite or Next.js)",
      status: "fail",
      detail: `${app.framework} is not supported for visual editing yet`,
    },
    {
      id: "editable_hosts",
      label: "Indexed hosts (informational)",
      status: index.entries.length > 0 ? "pass" : "warn",
      detail: `${index.entries.length} host(s)`,
    },
  ]);
}

export async function runDoctor(opts: DoctorOptions): Promise<number> {
  let targets: AppContext[];
  try {
    targets = resolveTargetApps(opts);
  } catch (e) {
    if (e instanceof PreflightError) {
      console.error(e.message);
      return 1;
    }
    throw e;
  }

  const outcomes = await Promise.all(targets.map((app) => runDoctorForApp(app, opts)));

  for (const { result } of outcomes) {
    const app = targets.find((t) => t.appId === result.appId);
    const pm = detectPackageManager(app?.appRoot ?? opts.cwd);
    const telemetry: DoctorRunTelemetry = {
      ...(app ? buildAppTelemetryProps(pm, app) : buildCliTelemetryProps(pm)),
      pass_count: result.passCount,
      warn_count: result.warnCount,
      fail_count: result.failCount,
      ready: result.failCount === 0,
    };
    captureCliEvent("doctor_run", telemetry);
  }

  if (opts.json) {
    const payload = outcomes.map((o) => o.result);
    console.log(JSON.stringify(payload.length === 1 ? payload[0] : payload, null, 2));
    return outcomes.some((o) => o.exit !== 0) ? 1 : 0;
  }

  let exit = 0;
  for (let i = 0; i < outcomes.length; i++) {
    const { result, exit: code } = outcomes[i]!;
    const app = targets[i]!;
    if (outcomes.length > 1) {
      if (i > 0) {
        console.log("");
      }
      console.log(`=== ${app.appId} (${formatFrameworkLabel(app)}) ===`);
    }
    console.log(`nuvio doctor — ${result.projectName}\n`);
    for (const check of result.checks) {
      const icon =
        check.status === "pass" ? "✅" : check.status === "warn" ? "⚠" : "❌";
      const suffix = check.detail ? ` — ${check.detail}` : "";
      console.log(`  ${icon} ${check.label}${suffix}`);
    }
    summarize(result);
    exit = Math.max(exit, code);
  }

  return exit;
}
