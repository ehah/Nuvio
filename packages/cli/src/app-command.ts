import { resolveTargetApps, type AppContext } from "./app-context.js";
import { PreflightError } from "./detect-project.js";
import { scanAppContext } from "./project-scan.js";

export type AppScopedCommandOptions = {
  cwd: string;
  app?: string;
  allApps?: boolean;
};

export function resolveCommandApps(
  opts: AppScopedCommandOptions,
): AppContext[] {
  return resolveTargetApps(opts);
}

export function scanForApp(app: AppContext) {
  return scanAppContext(app);
}

export function handlePreflightError(e: unknown): number | null {
  if (e instanceof PreflightError) {
    console.error(e.message);
    return 1;
  }
  return null;
}
