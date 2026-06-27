import { existsSync, readFileSync } from "node:fs";
import { findNextConfig } from "./patch-next-config.js";
import {
  layoutHasNuvioShell,
  resolveNextLayoutFile,
} from "./patch-next-layout.js";
import { resolveNextPagesAppFile } from "./patch-next-pages-app.js";
import { nextServerPath } from "./patch-next-server.js";
import { hasNuvioDependency } from "./nuvio-deps.js";
import { projectHasPageTitleId } from "./scan-ids.js";

export type NextVerification = {
  deps: "OK" | "MISSING";
  config: "OK" | "TODO";
  server: "OK" | "TODO";
  shell: "OK" | "TODO";
  starterId: "OK" | "MISSING";
};

export function nextConfigHasWithNuvio(configPath: string): boolean {
  if (!existsSync(configPath)) {
    return false;
  }
  return readFileSync(configPath, "utf8").includes("withNuvio");
}

export function verifyNextProject(
  root: string,
  packageJsonPath: string,
  router: "app" | "pages" | "mixed" | "none",
): NextVerification {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<
    string,
    unknown
  >;
  const depsOk =
    hasNuvioDependency(pkg, "@nuvio/overlay") &&
    hasNuvioDependency(pkg, "@nuvio/next");

  const configPath = findNextConfig(root);
  const configOk = configPath ? nextConfigHasWithNuvio(configPath) : false;

  const serverOk =
    existsSync(nextServerPath(root)) &&
    readFileSync(nextServerPath(root), "utf8").includes("Nuvio");

  let shellOk = false;
  if (router === "pages" || router === "mixed") {
    const pagesApp = resolveNextPagesAppFile(root);
    if (pagesApp) {
      shellOk = /NuvioNextShell/.test(readFileSync(pagesApp, "utf8"));
    }
  }
  if (!shellOk && (router === "app" || router === "mixed" || router === "none")) {
    const layout = resolveNextLayoutFile(root);
    shellOk = layout ? layoutHasNuvioShell(layout) : false;
  }

  return {
    deps: depsOk ? "OK" : "MISSING",
    config: configOk ? "OK" : "TODO",
    server: serverOk ? "OK" : "TODO",
    shell: shellOk ? "OK" : "TODO",
    starterId: projectHasPageTitleId(root) ? "OK" : "MISSING",
  };
}

export function printNextVerification(v: NextVerification): void {
  console.log("Verification:");
  console.log(`  dependencies: @nuvio/next, @nuvio/overlay — ${v.deps}`);
  console.log(`  next.config: withNuvio() — ${v.config}`);
  console.log(`  server.js: Nuvio dev server — ${v.server}`);
  console.log(`  layout/_app: NuvioNextShell — ${v.shell}`);
  console.log(`  Starter id page.title — ${v.starterId}`);
}
