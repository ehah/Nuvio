import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { resolveProjectScanGlobs } from "@nuvio/vite-plugin/scan";
import { detectPackageManager, type PackageManager } from "./detect-pm.js";
import { PreflightError } from "./detect-project.js";

export type FrameworkKind =
  | "vite"
  | "next-app"
  | "next-pages"
  | "next-mixed"
  | "react-unknown";

export type RouterKind = "app" | "pages" | "mixed" | "none";

export type AppContext = {
  repoRoot: string;
  appRoot: string;
  appId: string;
  framework: FrameworkKind;
  router: RouterKind;
  packageManager: PackageManager;
  packageJsonPath: string;
  packageJson: Record<string, unknown>;
  scanGlobs: readonly string[];
  devServerPort: number;
  tailwindOk: boolean;
};

export type DiscoveredApp = {
  appId: string;
  appRoot: string;
  framework: FrameworkKind;
  router: RouterKind;
  packageJson: Record<string, unknown>;
};

export type IgnoredPath = {
  path: string;
  reason: string;
};

export type WorkspaceDiscovery = {
  repoRoot: string;
  frontendApps: DiscoveredApp[];
  ignored: IgnoredPath[];
};

const APP_PACKAGE_JSON_CANDIDATES = [
  "package.json",
  "frontend/package.json",
  "dashboard/package.json",
  "widget/package.json",
] as const;

const BACKEND_DIR_NAMES = ["backend", "migrations", ".venv", "venv"] as const;

const BACKEND_FILE_NAMES = [
  "requirements.txt",
  "pyproject.toml",
  "main.py",
  "manage.py",
  "Dockerfile",
  "docker-compose.yml",
  "railway.toml",
  "render.yaml",
  "nixpacks.toml",
] as const;

function hasDep(pkg: Record<string, unknown>, name: string): boolean {
  const sections = ["dependencies", "devDependencies", "peerDependencies"] as const;
  for (const key of sections) {
    const deps = pkg[key];
    if (deps && typeof deps === "object" && name in (deps as Record<string, unknown>)) {
      return true;
    }
  }
  return false;
}

function pathExists(root: string, rel: string): boolean {
  return existsSync(join(root, rel));
}

function readPackageJsonAt(appRoot: string): Record<string, unknown> | null {
  const packageJsonPath = join(appRoot, "package.json");
  if (!existsSync(packageJsonPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function detectRouter(appRoot: string): RouterKind {
  const hasApp = pathExists(appRoot, "app") || pathExists(appRoot, "src/app");
  const hasPages = pathExists(appRoot, "pages") || pathExists(appRoot, "src/pages");
  if (hasApp && hasPages) {
    return "mixed";
  }
  if (hasApp) {
    return "app";
  }
  if (hasPages) {
    return "pages";
  }
  return "none";
}

function detectTailwind(appRoot: string, pkg: Record<string, unknown>): boolean {
  if (hasDep(pkg, "tailwindcss")) {
    return true;
  }
  const cssCandidates = [
    "src/index.css",
    "src/App.css",
    "src/app/globals.css",
    "app/globals.css",
  ];
  for (const rel of cssCandidates) {
    const p = join(appRoot, rel);
    if (!existsSync(p)) {
      continue;
    }
    const text = readFileSync(p, "utf8");
    if (
      text.includes("@tailwind") ||
      text.includes('@import "tailwindcss"') ||
      text.includes("@import 'tailwindcss'")
    ) {
      return true;
    }
  }
  return false;
}

export function detectFramework(
  appRoot: string,
  packageJson: Record<string, unknown>,
): FrameworkKind {
  const router = detectRouter(appRoot);
  if (hasDep(packageJson, "next")) {
    if (router === "mixed") {
      return "next-mixed";
    }
    if (router === "pages") {
      return "next-pages";
    }
    return "next-app";
  }
  if (hasDep(packageJson, "vite") && hasDep(packageJson, "react")) {
    return "vite";
  }
  if (hasDep(packageJson, "react")) {
    return "react-unknown";
  }
  return "react-unknown";
}

function isToolingPackage(packageJson: Record<string, unknown>): boolean {
  if (packageJson.name === "@nuvio/cli") {
    return true;
  }
  return packageJson.name === "nuvio" && packageJson.private === true;
}

function isFrontendCandidate(appRoot: string, packageJson: Record<string, unknown>): boolean {
  if (isToolingPackage(packageJson)) {
    return false;
  }
  if (!hasDep(packageJson, "react")) {
    return false;
  }
  const framework = detectFramework(appRoot, packageJson);
  return (
    framework === "vite" ||
    framework === "next-app" ||
    framework === "next-pages" ||
    framework === "next-mixed" ||
    framework === "react-unknown"
  );
}

function frameworkLabel(framework: FrameworkKind, router: RouterKind): string {
  switch (framework) {
    case "vite":
      return "Vite + React";
    case "next-app":
      return "Next.js (App Router)";
    case "next-pages":
      return "Next.js (Pages Router)";
    case "next-mixed":
      return "Next.js (App + Pages)";
    case "react-unknown":
      return "React (no Vite/Next)";
    default:
      return framework;
  }
}

export function formatFrameworkLabel(app: DiscoveredApp): string {
  return frameworkLabel(app.framework, app.router);
}

export function resolveRepoRoot(cwd: string): string {
  let dir = resolve(cwd);
  while (true) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return resolve(cwd);
}

function collectPackageJsonPaths(repoRoot: string): string[] {
  const paths = new Set<string>();
  for (const rel of APP_PACKAGE_JSON_CANDIDATES) {
    const abs = join(repoRoot, rel);
    if (existsSync(abs)) {
      paths.add(abs);
    }
  }
  for (const dir of ["apps", "packages"] as const) {
    const parent = join(repoRoot, dir);
    if (!existsSync(parent)) {
      continue;
    }
    for (const name of readdirSync(parent, { withFileTypes: true })) {
      if (!name.isDirectory()) {
        continue;
      }
      const pkg = join(parent, name.name, "package.json");
      if (existsSync(pkg)) {
        paths.add(pkg);
      }
    }
  }
  return [...paths];
}

export function discoverIgnoredPaths(repoRoot: string): IgnoredPath[] {
  const ignored: IgnoredPath[] = [];
  for (const dir of BACKEND_DIR_NAMES) {
    if (pathExists(repoRoot, dir)) {
      ignored.push({ path: dir, reason: "backend" });
    }
  }
  for (const file of BACKEND_FILE_NAMES) {
    if (pathExists(repoRoot, file)) {
      ignored.push({ path: file, reason: "backend" });
    }
  }
  return ignored;
}

export function discoverFrontendApps(repoRoot: string): DiscoveredApp[] {
  const root = resolve(repoRoot);
  const apps: DiscoveredApp[] = [];
  const seenRoots = new Set<string>();

  for (const packageJsonPath of collectPackageJsonPaths(root)) {
    const appRoot = dirname(packageJsonPath);
    const resolvedRoot = resolve(appRoot);
    if (seenRoots.has(resolvedRoot)) {
      continue;
    }
    const packageJson = readPackageJsonAt(resolvedRoot);
    if (!packageJson || !isFrontendCandidate(resolvedRoot, packageJson)) {
      continue;
    }
    seenRoots.add(resolvedRoot);
    const appId = relative(root, resolvedRoot).replace(/\\/g, "/") || ".";
    apps.push({
      appId,
      appRoot: resolvedRoot,
      framework: detectFramework(resolvedRoot, packageJson),
      router: detectRouter(resolvedRoot),
      packageJson,
    });
  }

  apps.sort((a, b) => a.appId.localeCompare(b.appId));
  return apps;
}

export function discoverWorkspace(cwd: string): WorkspaceDiscovery {
  const repoRoot = resolveRepoRoot(cwd);
  return {
    repoRoot,
    frontendApps: discoverFrontendApps(repoRoot),
    ignored: discoverIgnoredPaths(repoRoot),
  };
}

function devServerPortFor(framework: FrameworkKind): number {
  if (framework.startsWith("next")) {
    return Number(process.env.PORT ?? 3000);
  }
  return 5173;
}

export function buildAppContext(
  discovered: DiscoveredApp,
  repoRoot: string,
  pmOverride?: PackageManager,
): AppContext {
  const appRoot = discovered.appRoot;
  const packageJsonPath = join(appRoot, "package.json");
  return {
    repoRoot,
    appRoot,
    appId: discovered.appId,
    framework: discovered.framework,
    router: discovered.router,
    packageManager: detectPackageManager(appRoot, pmOverride),
    packageJsonPath,
    packageJson: discovered.packageJson,
    scanGlobs: resolveProjectScanGlobs(appRoot),
    devServerPort: devServerPortFor(discovered.framework),
    tailwindOk: detectTailwind(appRoot, discovered.packageJson),
  };
}

function appContextFromRoot(appRoot: string, repoRoot: string): AppContext | null {
  const packageJson = readPackageJsonAt(appRoot);
  if (!packageJson || !isFrontendCandidate(appRoot, packageJson)) {
    return null;
  }
  const appId = relative(repoRoot, appRoot).replace(/\\/g, "/") || ".";
  return buildAppContext(
    {
      appId,
      appRoot: resolve(appRoot),
      framework: detectFramework(appRoot, packageJson),
      router: detectRouter(appRoot),
      packageJson,
    },
    repoRoot,
  );
}

function resolveAppIdMatch(apps: DiscoveredApp[], appId: string): DiscoveredApp | null {
  const normalized = appId.replace(/\\/g, "/").replace(/^\.\//, "");
  const exact = apps.find((a) => a.appId === normalized);
  if (exact) {
    return exact;
  }
  const suffixMatches = apps.filter(
    (a) => a.appId === normalized || a.appId.endsWith(`/${normalized}`) || a.appId.split("/").pop() === normalized,
  );
  if (suffixMatches.length === 1) {
    return suffixMatches[0]!;
  }
  return null;
}

export function printWorkspaceDiscovery(discovery: WorkspaceDiscovery): void {
  if (discovery.frontendApps.length > 0) {
    console.log("Detected frontend apps:");
    discovery.frontendApps.forEach((app, index) => {
      console.log(`  ${index + 1}. ${app.appId} — ${formatFrameworkLabel(app)}`);
    });
  } else {
    console.log("Detected frontend apps: (none)");
  }
  if (discovery.ignored.length > 0) {
    console.log("\nBackend detected (ignored):");
    for (const item of discovery.ignored) {
      console.log(`  - ${item.path}`);
    }
  }
}

export type ResolveTargetAppsOptions = {
  cwd: string;
  app?: string;
  allApps?: boolean;
};

export function resolveTargetApps(opts: ResolveTargetAppsOptions): AppContext[] {
  const cwd = resolve(opts.cwd);
  const discovery = discoverWorkspace(cwd);
  const { repoRoot, frontendApps, ignored } = discovery;

  if (frontendApps.length === 0) {
    if (ignored.length > 0) {
      throw new PreflightError(
        "No frontend apps detected in this repo. Backend paths were ignored — point --cwd at a React app folder.",
      );
    }
    throw new PreflightError("No frontend apps detected. Run from a React + Vite or Next.js app folder.");
  }

  if (opts.allApps) {
    return frontendApps.map((app) => buildAppContext(app, repoRoot));
  }

  if (opts.app) {
    const match = resolveAppIdMatch(frontendApps, opts.app);
    if (!match) {
      throw new PreflightError(
        `No frontend app "${opts.app}". Known apps: ${frontendApps.map((a) => a.appId).join(", ")}`,
      );
    }
    return [buildAppContext(match, repoRoot)];
  }

  const direct = appContextFromRoot(cwd, repoRoot);
  if (direct) {
    return [direct];
  }

  if (frontendApps.length === 1) {
    return [buildAppContext(frontendApps[0]!, repoRoot)];
  }

  if (isToolingPackage(readPackageJsonAt(cwd) ?? {})) {
    throw new PreflightError(
      `Multiple frontend apps detected under ${repoRoot}. Use --app <id> or --all-apps.\n` +
        `Apps: ${frontendApps.map((a) => a.appId).join(", ")}`,
    );
  }

  throw new PreflightError(
    `Multiple frontend apps detected. Use --app <id> or --all-apps.\n` +
      `Apps: ${frontendApps.map((a) => a.appId).join(", ")}`,
  );
}
