import { resolve } from "node:path";
import type { DuplicateIdError, IndexWireEntry } from "@nuvio/shared";
import {
  evaluatePageCoverage,
  pccCategoryLabel,
  type CoverageEvaluationResult,
} from "@nuvio/shared";
import {
  listPccManifestFiles,
  loadPccManifestFromFile,
  resolvePccManifestPath,
} from "@nuvio/shared/load-pcc-manifest";
import type { AppContext } from "./app-context.js";
import {
  handlePreflightError,
  resolveCommandApps,
  scanForApp,
  type AppScopedCommandOptions,
} from "./app-command.js";

export type CoverageVerifyOptions = AppScopedCommandOptions & {
  page?: string;
  manifest?: string;
  all?: boolean;
  json?: boolean;
};

export type CoverageVerifyAllResult = {
  pass: boolean;
  pages: Array<{
    manifestPath: string;
    result: CoverageEvaluationResult;
  }>;
};

function formatCategoryLine(summary: CoverageEvaluationResult["categories"][number]): string {
  const label = pccCategoryLabel(summary.category).padEnd(10);
  const status = summary.pass ? "PASS" : "FAIL";
  return `${label} ${status} ${summary.indexed}/${summary.expected}`;
}

function printHumanReport(result: CoverageEvaluationResult, manifestPath: string): void {
  console.log("Nuvio Coverage Report\n");
  console.log(`Page: ${result.page}`);
  console.log(`Route: ${result.route}`);
  console.log(`Manifest: ${manifestPath}\n`);

  console.log("Category summary:");
  for (const category of result.categories) {
    console.log(formatCategoryLine(category));
  }

  console.log("\nCoverage gates:");
  const g = result.gates;
  console.log(`Indexed      ${g.indexed}/${g.expected}`);
  console.log(`Patchable    ${g.patchable}/${g.expected}`);
  console.log(`Categorized  ${g.categorized}/${g.expected}`);
  console.log(`Editable     ${g.editable}/${g.expected}`);
  console.log(`Brandable    ${g.brandable}/${g.expected}`);

  console.log("\nBrandability:");
  console.log(`Brandable      ${result.brandableCount}`);
  console.log(`Editable-only  ${result.editableOnlyCount}`);

  const missing = result.issues.filter((i) => i.kind === "missing");
  const unpatchable = result.issues.filter((i) => i.kind === "unpatchable");
  const duplicates = result.issues.filter((i) => i.kind === "duplicate_id");

  if (missing.length > 0) {
    console.log("\nMissing hosts:");
    for (const issue of missing) {
      console.log(`- ${issue.hostId} (${issue.category})`);
    }
  }

  if (unpatchable.length > 0) {
    console.log("\nUnpatchable hosts:");
    for (const issue of unpatchable) {
      console.log(`- ${issue.hostId}`);
      if (issue.reason) {
        console.log(`  reason: ${issue.reason}`);
      }
    }
  }

  if (duplicates.length > 0) {
    console.log("\nDuplicate id hosts:");
    for (const issue of duplicates) {
      console.log(`- ${issue.hostId}`);
    }
  }

  console.log(`\nResult: ${result.pass ? "PASS" : "FAIL"}`);
}

function printAllHumanReport(summary: CoverageVerifyAllResult): void {
  console.log("Nuvio Coverage Report (all pages)\n");
  for (const entry of summary.pages) {
    const status = entry.result.pass ? "PASS" : "FAIL";
    console.log(`${entry.result.page.padEnd(16)} ${status}  ${entry.manifestPath}`);
  }
  console.log(`\nResult: ${summary.pass ? "PASS" : "FAIL"}`);
}

function verifyLoadedManifest(
  manifestPath: string,
  entries: readonly IndexWireEntry[],
  duplicateErrors: readonly DuplicateIdError[],
):
  | { ok: true; result: CoverageEvaluationResult }
  | { ok: false; code: number; message: string } {
  const loaded = loadPccManifestFromFile(manifestPath);
  if (!loaded.ok) {
    return {
      ok: false,
      code: 2,
      message: `Invalid PCC manifest (${manifestPath}): ${loaded.error.message}`,
    };
  }
  const result = evaluatePageCoverage(loaded.manifest, entries, duplicateErrors);
  return { ok: true, result };
}

function runCoverageVerifyAllForApp(app: AppContext, opts: CoverageVerifyOptions): number {
  const manifestPaths = listPccManifestFiles(app.appRoot);
  if (manifestPaths.length === 0) {
    console.error(`No PCC manifests found under ${resolve(app.appRoot)}/nuvio/pages`);
    return 2;
  }

  const { index } = scanForApp(app);

  const pages: CoverageVerifyAllResult["pages"] = [];
  for (const manifestPath of manifestPaths) {
    const verified = verifyLoadedManifest(
      manifestPath,
      index.entries,
      index.duplicateErrors,
    );
    if (!verified.ok) {
      console.error(verified.message);
      return verified.code;
    }
    pages.push({ manifestPath, result: verified.result });
  }

  const summary: CoverageVerifyAllResult = {
    pass: pages.every((page) => page.result.pass),
    pages,
  };

  if (opts.json) {
    console.log(JSON.stringify({ appId: app.appId, ...summary }, null, 2));
    return summary.pass ? 0 : 1;
  }

  printAllHumanReport(summary);
  return summary.pass ? 0 : 1;
}

function runCoverageVerifyForApp(app: AppContext, opts: CoverageVerifyOptions): number {
  if (opts.all) {
    return runCoverageVerifyAllForApp(app, opts);
  }

  let manifestPath: string;
  try {
    manifestPath = resolve(
      resolvePccManifestPath(app.appRoot, { page: opts.page, manifest: opts.manifest }),
    );
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 2;
  }

  const { index } = scanForApp(app);

  const verified = verifyLoadedManifest(
    manifestPath,
    index.entries,
    index.duplicateErrors,
  );
  if (!verified.ok) {
    console.error(verified.message);
    return verified.code;
  }

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          appId: app.appId,
          manifestPath,
          ...verified.result,
        },
        null,
        2,
      ),
    );
    return verified.result.pass ? 0 : 1;
  }

  printHumanReport(verified.result, manifestPath);
  return verified.result.pass ? 0 : 1;
}

export function runCoverageVerifyAll(opts: CoverageVerifyOptions): number {
  return runCoverageVerify({ ...opts, all: true });
}

export function runCoverageVerify(opts: CoverageVerifyOptions): number {
  let apps: AppContext[];
  try {
    apps = resolveCommandApps(opts);
  } catch (e) {
    const code = handlePreflightError(e);
    if (code !== null) {
      return code;
    }
    throw e;
  }

  let exit = 0;
  for (let i = 0; i < apps.length; i++) {
    const app = apps[i]!;
    if (apps.length > 1) {
      if (i > 0) {
        console.log("");
      }
      console.log(`=== ${app.appId} ===`);
    }
    exit = Math.max(exit, runCoverageVerifyForApp(app, opts));
  }
  return exit;
}
