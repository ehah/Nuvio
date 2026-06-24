import { readRuntimeVersions } from "@nuvio/vite-plugin/scan";
import { formatFrameworkLabel, resolveTargetApps } from "./app-context.js";
import type { AppContext } from "./app-context.js";
import { detectPackageManager } from "./detect-pm.js";
import { PreflightError } from "./detect-project.js";
import {
  aggregateClassNameModes,
  isTableHost,
  relPath,
  scanAppContext,
} from "./project-scan.js";
import {
  buildAppTelemetryProps,
  captureCliEvent,
  type StatsRunTelemetry,
} from "./telemetry.js";

export type StatsOptions = {
  cwd: string;
  app?: string;
  allApps?: boolean;
  json?: boolean;
};

export type StatsResult = {
  appId: string;
  framework: string;
  router: string;
  projectName: string;
  editableHosts: number;
  taggedFiles: number;
  scannedFiles: number;
  duplicateIds: number;
  tableHosts: number;
  detectedLibraries: string[];
  tailwindVersion?: string;
  classNameModes: Record<string, number>;
};

function runStatsForApp(app: AppContext): StatsResult {
  const { detectedLibraries, index } = scanAppContext(app);
  const projectName = String(app.packageJson.name ?? app.appId);
  const taggedFiles = new Set(
    index.entries.map((e) => relPath(app.appRoot, e.file)),
  ).size;
  const classNameModes = aggregateClassNameModes(index.entries);
  const tableHosts = index.entries.filter(isTableHost).length;
  const versions = readRuntimeVersions(app.appRoot);

  return {
    appId: app.appId,
    framework: app.framework,
    router: app.router,
    projectName,
    editableHosts: index.entries.length,
    taggedFiles,
    scannedFiles: index.scannedFileCount,
    duplicateIds: index.duplicateErrors.length,
    tableHosts,
    detectedLibraries,
    tailwindVersion: versions.tailwindVersion,
    classNameModes,
  };
}

export function runStats(opts: StatsOptions): number {
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

  const results = targets.map((app) => {
    const result = runStatsForApp(app);
    const pm = detectPackageManager(app.appRoot);
    const telemetry: StatsRunTelemetry = {
      ...buildAppTelemetryProps(pm, app),
      editable_hosts: result.editableHosts,
      tagged_files: result.taggedFiles,
      duplicate_ids: result.duplicateIds,
      table_hosts: result.tableHosts,
      library_count: result.detectedLibraries.length,
    };
    captureCliEvent("stats_run", telemetry);
    return result;
  });

  if (opts.json) {
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
    return 0;
  }

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    const app = targets[i]!;
    if (results.length > 1) {
      if (i > 0) {
        console.log("");
      }
      console.log(`=== ${app.appId} (${formatFrameworkLabel(app)}) ===`);
    }
    console.log("nuvio stats\n");
    console.log(`  Framework:          ${result.framework}`);
    console.log(`  Router:             ${result.router}`);
    console.log(`  Editable hosts:     ${result.editableHosts}`);
    console.log(`  Tagged files:       ${result.taggedFiles}`);
    console.log(`  Files scanned:      ${result.scannedFiles}`);
    console.log(
      `  Libraries detected: ${
        result.detectedLibraries.length > 0
          ? result.detectedLibraries.join(", ")
          : "none"
      }`,
    );
    console.log(`  Table hosts:        ${result.tableHosts}`);
    console.log(`  Duplicate ids:      ${result.duplicateIds}`);
    if (result.tailwindVersion) {
      console.log(`  Tailwind version:   ${result.tailwindVersion}`);
    }
    const modeParts = Object.entries(result.classNameModes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mode, count]) => `${mode} ${count}`);
    if (modeParts.length > 0) {
      console.log(`  Class modes:        ${modeParts.join(", ")}`);
    }
  }

  return 0;
}
