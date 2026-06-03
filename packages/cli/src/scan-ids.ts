import { readFileSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";

const ID_GLOB = ["src/**/*.{tsx,jsx}"];

export function projectHasPageTitleId(root: string): boolean {
  const files = fg.sync(ID_GLOB, { cwd: root, absolute: true });
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (/data-nuvio-id=["']page\.title["']/.test(text)) {
      return true;
    }
  }
  return false;
}

export function findHeadingFiles(root: string): string[] {
  const files = fg.sync(ID_GLOB, { cwd: root, absolute: true });
  const ordered = [
    join(root, "src/App.tsx"),
    join(root, "src/App.jsx"),
    ...files.filter(
      (f) => !f.endsWith("App.tsx") && !f.endsWith("App.jsx"),
    ),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of ordered) {
    if (!seen.has(f) && files.includes(f)) {
      seen.add(f);
      out.push(f);
    }
  }
  for (const f of files) {
    if (!seen.has(f)) out.push(f);
  }
  return out;
}
