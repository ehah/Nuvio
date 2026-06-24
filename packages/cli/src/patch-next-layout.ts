import traverse from "./babel-traverse.js";
import type { NodePath } from "./babel-traverse.js";
import * as t from "@babel/types";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseTs, printTs } from "./parse-ts.js";
import type { PatchOutcome } from "./patch-vite-config.js";

const LAYOUT_CANDIDATES = [
  "src/app/layout.tsx",
  "src/app/layout.jsx",
  "app/layout.tsx",
  "app/layout.jsx",
] as const;

const SHELL_IMPORT = "@nuvio/overlay/next";
const STYLE_IMPORT = "@nuvio/overlay/style.css";
const SHELL_NAME = "NuvioNextShell";

export function resolveNextLayoutFile(root: string): string | null {
  for (const rel of LAYOUT_CANDIDATES) {
    const p = join(root, rel);
    if (existsSync(p)) {
      return p;
    }
  }
  return null;
}

function hasShellImport(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      if (path.node.source.value === SHELL_IMPORT) {
        found = true;
      }
    },
  });
  return found;
}

function hasStyleImport(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      if (path.node.source.value === STYLE_IMPORT) {
        found = true;
      }
    },
  });
  return found;
}

function hasShellElement(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    JSXElement(path: NodePath<t.JSXElement>) {
      const name = path.node.openingElement.name;
      if (t.isJSXIdentifier(name) && name.name === SHELL_NAME) {
        found = true;
      }
    },
  });
  return found;
}

function appendShellToBody(ast: t.File): boolean {
  let patched = false;
  const shell = t.jsxElement(
    t.jsxOpeningElement(t.jsxIdentifier(SHELL_NAME), [], true),
    null,
    [],
    true,
  );

  traverse(ast, {
    JSXElement(path: NodePath<t.JSXElement>) {
      if (patched) {
        return;
      }
      const name = path.node.openingElement.name;
      if (!t.isJSXIdentifier(name) || name.name !== "body") {
        return;
      }
      path.node.children.push(t.jsxText("\n        "));
      path.node.children.push(shell);
      patched = true;
    },
  });

  return patched;
}

export function patchNextLayoutFile(filePath: string): PatchOutcome {
  const source = readFileSync(filePath, "utf8");
  let ast: t.File;
  try {
    ast = parseTs(source, filePath);
  } catch {
    return { ok: false, error: "parse failed" };
  }

  if (hasShellImport(ast) && hasShellElement(ast) && hasStyleImport(ast)) {
    return { ok: true, skipped: true };
  }

  if (!hasStyleImport(ast)) {
    ast.program.body.unshift(
      t.importDeclaration([], t.stringLiteral(STYLE_IMPORT)),
    );
  }

  if (!hasShellImport(ast)) {
    ast.program.body.unshift(
      t.importDeclaration(
        [t.importSpecifier(t.identifier(SHELL_NAME), t.identifier(SHELL_NAME))],
        t.stringLiteral(SHELL_IMPORT),
      ),
    );
  }

  if (!hasShellElement(ast) && !appendShellToBody(ast)) {
    return { ok: false, error: "no <body> to patch" };
  }

  writeFileSync(filePath, printTs(ast, source), "utf8");
  return { ok: true };
}

export function layoutHasNuvioShell(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return false;
  }
  try {
    const ast = parseTs(readFileSync(filePath, "utf8"), filePath);
    return hasShellImport(ast) && hasShellElement(ast);
  } catch {
    const text = readFileSync(filePath, "utf8");
    return /NuvioNextShell/.test(text) && /@nuvio\/overlay\/next/.test(text);
  }
}
