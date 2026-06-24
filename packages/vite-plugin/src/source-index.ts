import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "@babel/parser";
import traverseImport, { type NodePath } from "@babel/traverse";
import type { JSXOpeningElement } from "@babel/types";
import fg from "fast-glob";
import type { DuplicateIdError, IndexWireEntry, LibraryId } from "@nuvio/shared";
import { analyzeHost, buildIndexEntry, type ClassNameMode } from "./source-index-metadata.js";
import { enrichTableIndexFromSource } from "./source-index-table.js";
import {
  expandTemplateNuvioIds,
  extractRowKeysFromTableDataConst,
} from "./source-index-template-ids.js";
import { NUVIO_DEFAULT_IGNORE_GLOBS } from "./scan-globs.js";

function getTraverseFn(): (ast: import("@babel/types").File, visitor: object) => void {
  if (typeof traverseImport === "function") {
    return traverseImport as (ast: import("@babel/types").File, visitor: object) => void;
  }
  const d = (traverseImport as { default?: unknown }).default;
  if (typeof d === "function") {
    return d as (ast: import("@babel/types").File, visitor: object) => void;
  }
  throw new Error("[Nuvio] @babel/traverse did not resolve to a callable export");
}

export type SourceIndexEntry = IndexWireEntry;

export type BuildSourceIndexResult = {
  entries: SourceIndexEntry[];
  duplicateErrors: DuplicateIdError[];
  parseErrors: Array<{ file: string; message: string }>;
  /** Files matched by glob (before id extraction). */
  scannedFileCount: number;
};

/** JSX tags whose string `id="..."` prop maps like `data-nuvio-id`. */
const WRAPPER_TAGS = new Set(["EditableText", "EditableContainer"]);

/**
 * Extract every contract id occurrence from a single TSX/JSX source string.
 */
export function extractIdsFromSource(
  fileAbs: string,
  code: string,
  options?: { classNameMode?: ClassNameMode; detectedLibraries?: readonly LibraryId[] },
): SourceIndexEntry[] {
  const acc: SourceIndexEntry[] = [];
  let ast;
  try {
    ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
      sourceFilename: fileAbs,
    });
  } catch {
    return acc;
  }

  const rowKeys = extractRowKeysFromTableDataConst(code);

  const traverseFn = getTraverseFn();
  traverseFn(ast, {
    JSXOpeningElement(p: NodePath<JSXOpeningElement>) {
      const opening = p.node;
      let tagName = "";
      if (opening.name.type === "JSXIdentifier") {
        tagName = opening.name.name;
      } else {
        return;
      }

      for (const attr of opening.attributes) {
        if (attr.type !== "JSXAttribute") {
          continue;
        }
        if (attr.name.type !== "JSXIdentifier") {
          continue;
        }
        const prop = attr.name.name;
        const loc = attr.loc?.start ?? opening.loc?.start;
        const line = loc?.line ?? 1;
        const column = loc?.column ?? 0;

        const pushEntry = (id: string) => {
          const ctx = analyzeHost(p, options?.classNameMode ?? "literal-only");
          if (!ctx) {
            acc.push({ id, file: path.resolve(fileAbs), line, column });
            return;
          }
          acc.push(
            buildIndexEntry(
              { id, file: path.resolve(fileAbs), line, column },
              ctx,
              p,
              options?.detectedLibraries ?? [],
            ),
          );
        };

        if (prop === "data-nuvio-id") {
          if (attr.value?.type === "StringLiteral") {
            const id = attr.value.value.trim();
            if (id) {
              pushEntry(id);
            }
            continue;
          }
          if (rowKeys.length > 0) {
            const expanded = expandTemplateNuvioIds(attr, rowKeys);
            for (const id of expanded) {
              pushEntry(id);
            }
            if (expanded.length > 0) {
              continue;
            }
          }
        }

        if (WRAPPER_TAGS.has(tagName) && prop === "id" && attr.value?.type === "StringLiteral") {
          const id = attr.value.value.trim();
          if (id) {
            pushEntry(id);
          }
        }
      }
    },
  });

  return acc;
}

/**
 * Scan `rootAbs` with glob patterns (relative to `rootAbs`, or absolute) and build `id → file` map.
 * Duplicate ids across the project produce `duplicateErrors`; those ids are omitted from `entries`.
 */
export function buildSourceIndex(
  rootAbs: string,
  globPatterns: string[],
  options?: { classNameMode?: ClassNameMode; detectedLibraries?: readonly LibraryId[] },
): BuildSourceIndexResult {
  const root = path.resolve(rootAbs);
  const parseErrors: Array<{ file: string; message: string }> = [];
  const normalizedPatterns = globPatterns.map((g) => {
    const resolved = path.isAbsolute(g) ? path.resolve(g) : path.resolve(root, g);
    return resolved.replace(/\\/g, "/");
  });
  const matched = fg.sync(normalizedPatterns, {
    absolute: true,
    ignore: [...NUVIO_DEFAULT_IGNORE_GLOBS],
    onlyFiles: true,
  });
  const files = [...new Set(matched)];

  const byId = new Map<string, SourceIndexEntry[]>();
  const fileToSource = new Map<string, string>();

  for (const file of files) {
    let code: string;
    try {
      code = fs.readFileSync(file, "utf8");
    } catch (e) {
      parseErrors.push({ file, message: String(e) });
      continue;
    }
    fileToSource.set(path.resolve(file), code);

    let occurrences: SourceIndexEntry[];
    try {
      occurrences = extractIdsFromSource(file, code, options);
    } catch (e) {
      parseErrors.push({ file, message: String(e) });
      continue;
    }

    for (const occ of occurrences) {
      const list = byId.get(occ.id) ?? [];
      list.push(occ);
      byId.set(occ.id, list);
    }
  }

  const duplicateErrors: DuplicateIdError[] = [];
  const entries: SourceIndexEntry[] = [];

  for (const [id, list] of byId) {
    if (list.length > 1) {
      duplicateErrors.push({
        id,
        occurrences: list.map((o) => ({
          file: o.file,
          line: o.line,
          column: o.column,
        })),
      });
    } else if (list.length === 1) {
      entries.push(list[0]!);
    }
  }

  enrichTableIndexFromSource(entries, fileToSource);

  entries.sort((a, b) => {
    const fa = a.file.localeCompare(b.file);
    if (fa !== 0) {
      return fa;
    }
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return a.column - b.column;
  });

  duplicateErrors.sort((a, b) => a.id.localeCompare(b.id));

  return {
    entries,
    duplicateErrors,
    parseErrors,
    scannedFileCount: files.length,
  };
}

function indexQuality(b: BuildSourceIndexResult): readonly [number, number, number] {
  return [b.entries.length, -b.duplicateErrors.length, b.scannedFileCount] as const;
}

function isBetterIndex(candidate: BuildSourceIndexResult, current: BuildSourceIndexResult): boolean {
  const c = indexQuality(candidate);
  const b = indexQuality(current);
  for (let i = 0; i < 3; i++) {
    if (c[i] !== b[i]) {
      return c[i]! > b[i]!;
    }
  }
  return false;
}

/**
 * Run {@link buildSourceIndex} for each unique candidate root and keep the best result
 * (most ids, then fewest duplicate-id collisions, then most files scanned).
 */
export function pickBestSourceIndex(
  rootCandidates: string[],
  globPatterns: string[],
  options?: { classNameMode?: ClassNameMode; detectedLibraries?: readonly LibraryId[] },
): BuildSourceIndexResult {
  const roots = [...new Set(rootCandidates.map((r) => path.resolve(r)).filter((r) => r.length > 0))];
  if (roots.length === 0) {
    return {
      entries: [],
      duplicateErrors: [],
      parseErrors: [],
      scannedFileCount: 0,
    };
  }
  let best = buildSourceIndex(roots[0]!, globPatterns, options);
  for (let i = 1; i < roots.length; i++) {
    const built = buildSourceIndex(roots[i]!, globPatterns, options);
    if (isBetterIndex(built, best)) {
      best = built;
    }
  }
  return best;
}
