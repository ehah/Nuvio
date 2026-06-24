import * as fs from "node:fs";
import * as path from "node:path";
import type { LibraryId } from "@nuvio/shared";

function hasDep(packageJson: Record<string, unknown>, name: string): boolean {
  const sections = ["dependencies", "devDependencies", "peerDependencies"] as const;
  for (const key of sections) {
    const deps = packageJson[key];
    if (deps && typeof deps === "object" && name in (deps as Record<string, unknown>)) {
      return true;
    }
  }
  return false;
}

function dirHasUiComponents(dirAbs: string): boolean {
  try {
    const names = fs.readdirSync(dirAbs);
    return names.some((n) => /\.(tsx|jsx)$/.test(n));
  } catch {
    return false;
  }
}

function pathExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

/** Best-effort library detection for dev index diagnostics (v0.8). */
export function detectProjectLibraries(
  projectRootAbs: string,
  packageJson?: Record<string, unknown>,
): LibraryId[] {
  const root = path.resolve(projectRootAbs);
  const found = new Set<LibraryId>();

  let pkg = packageJson;
  if (!pkg) {
    try {
      pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as Record<
        string,
        unknown
      >;
    } catch {
      pkg = {};
    }
  }

  for (const rel of [
    "components/ui",
    "src/components/ui",
    "app/components/ui",
    "src/app/components/ui",
  ]) {
    const uiDir = path.join(root, rel);
    if (dirHasUiComponents(uiDir)) {
      found.add("shadcn");
      break;
    }
  }

  if (hasDep(pkg, "daisyui")) {
    found.add("daisyui");
  }

  const pkgName = String(pkg.name ?? "");
  if (/tailadmin/i.test(pkgName)) {
    found.add("tailadmin");
  }
  if (
    pathExists(root, "src/layout/AppSidebar.tsx") ||
    pathExists(root, "src/components/ecommerce")
  ) {
    found.add("tailadmin");
  }

  return [...found];
}
