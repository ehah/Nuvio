import { readFileSync } from "node:fs";

export type NuvioPackageName =
  | "@nuvio/vite-plugin"
  | "@nuvio/overlay"
  | "@nuvio/next";

export function readPackageJson(
  packageJsonPath: string,
): Record<string, unknown> {
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<
    string,
    unknown
  >;
}

export function getDependencyVersion(
  pkg: Record<string, unknown>,
  name: NuvioPackageName,
): string | undefined {
  const deps = pkg.dependencies as Record<string, string> | undefined;
  const devDeps = pkg.devDependencies as Record<string, string> | undefined;
  return deps?.[name] ?? devDeps?.[name];
}

export function hasNuvioDependency(
  pkg: Record<string, unknown>,
  name: NuvioPackageName,
): boolean {
  return Boolean(getDependencyVersion(pkg, name));
}

export function hasNuvioPackages(pkg: Record<string, unknown>): boolean {
  return (
    hasNuvioDependency(pkg, "@nuvio/vite-plugin") &&
    hasNuvioDependency(pkg, "@nuvio/overlay")
  );
}

export function hasNextNuvioPackages(pkg: Record<string, unknown>): boolean {
  return (
    hasNuvioDependency(pkg, "@nuvio/next") &&
    hasNuvioDependency(pkg, "@nuvio/overlay")
  );
}

export function isWorkspaceLinkedVersion(version: string | undefined): boolean {
  if (!version) return false;
  return (
    version.startsWith("workspace:") ||
    version.startsWith("link:") ||
    version.startsWith("file:")
  );
}

export function nuvioOverlayLinkKind(
  pkg: Record<string, unknown>,
): "npm" | "workspace" | "missing" {
  const raw = getDependencyVersion(pkg, "@nuvio/overlay");
  if (!raw) return "missing";
  return isWorkspaceLinkedVersion(raw) ? "workspace" : "npm";
}
