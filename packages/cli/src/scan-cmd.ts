import { formatFrameworkLabel, resolveTargetApps } from "./app-context.js";
import type { AppContext } from "./app-context.js";
import { PreflightError } from "./detect-project.js";
import { detectPackageManager } from "./detect-pm.js";
import { relPath, scanAppContext } from "./project-scan.js";
import {
  buildAppTelemetryProps,
  captureCliEvent,
  type ScanRunTelemetry,
} from "./telemetry.js";

export type ScanOptions = {
  cwd: string;
  app?: string;
  allApps?: boolean;
  json?: boolean;
};

export type ScanHostRow = {
  id: string;
  file: string;
  line: number;
  column: number;
  libraryHint?: string;
  classNameMode?: string;
};

export type ScanResult = {
  appId: string;
  framework: string;
  router: string;
  projectName: string;
  hosts: ScanHostRow[];
  hostCount: number;
  duplicateErrors: Array<{ id: string; occurrences: Array<{ file: string; line: number }> }>;
  detectedLibraries: string[];
  scannedFileCount: number;
};

function runScanForApp(app: AppContext, json: boolean): { result: ScanResult; exit: number } {
  const { detectedLibraries, index } = scanAppContext(app);
  const projectName = String(app.packageJson.name ?? app.appId);

  const hosts: ScanHostRow[] = index.entries.map((entry) => ({
    id: entry.id,
    file: relPath(app.appRoot, entry.file),
    line: entry.line,
    column: entry.column,
    libraryHint: entry.libraryHint,
    classNameMode: entry.classNameMode,
  }));

  const result: ScanResult = {
    appId: app.appId,
    framework: app.framework,
    router: app.router,
    projectName,
    hosts,
    hostCount: hosts.length,
    duplicateErrors: index.duplicateErrors.map((dup) => ({
      id: dup.id,
      occurrences: dup.occurrences.map((o) => ({
        file: relPath(app.appRoot, o.file),
        line: o.line,
      })),
    })),
    detectedLibraries,
    scannedFileCount: index.scannedFileCount,
  };

  const pm = detectPackageManager(app.appRoot);
  const telemetry: ScanRunTelemetry = {
    ...buildAppTelemetryProps(pm, app),
    host_count: result.hostCount,
    duplicate_count: result.duplicateErrors.length,
    library_count: detectedLibraries.length,
  };
  captureCliEvent("scan_run", telemetry);

  if (json) {
    return { result, exit: result.duplicateErrors.length > 0 ? 1 : 0 };
  }

  console.log(`nuvio scan — ${projectName} (${formatFrameworkLabel(app)})\n`);
  console.log(`  framework: ${app.framework}`);
  console.log(`  router: ${app.router}`);
  console.log(`  hosts: ${result.hostCount}\n`);

  for (const host of hosts) {
    console.log(`  ${host.id.padEnd(28)} ${host.file}:${host.line}`);
  }

  if (result.duplicateErrors.length > 0) {
    console.log("");
    for (const dup of result.duplicateErrors) {
      const places = dup.occurrences
        .map((o) => `${o.file}:${o.line}`)
        .join(", ");
      console.log(`  ❌ duplicate id: ${dup.id} (${places}) — fix before apply`);
    }
  }

  if (detectedLibraries.length > 0) {
    console.log(`\n  Libraries: ${detectedLibraries.join(", ")}`);
  }

  if (result.hostCount === 0) {
    console.log(
      "\n  No hosts found — use Make Editable in the browser or add data-nuvio-id manually.",
    );
  }

  return { result, exit: result.duplicateErrors.length > 0 ? 1 : 0 };
}

export function runScan(opts: ScanOptions): number {
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

  if (opts.json) {
    const results = targets.map((app) => runScanForApp(app, true).result);
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
    return results.some((r) => r.duplicateErrors.length > 0) ? 1 : 0;
  }

  let exit = 0;
  for (let i = 0; i < targets.length; i++) {
    if (targets.length > 1 && i > 0) {
      console.log("");
    }
    if (targets.length > 1) {
      console.log(`=== ${targets[i]!.appId} ===`);
    }
    const { exit: code } = runScanForApp(targets[i]!, false);
    exit = Math.max(exit, code);
  }
  return exit;
}
