import traverse from "./babel-traverse.js";
import type { NodePath } from "./babel-traverse.js";
import * as t from "@babel/types";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseTs, printTs } from "./parse-ts.js";
import type { PatchOutcome } from "./patch-vite-config.js";

const APP_CANDIDATES = [
  "src/App.tsx",
  "src/App.jsx",
  "src/main.tsx",
  "src/main.jsx",
] as const;

export function resolveAppFile(root: string): string | null {
  for (const rel of APP_CANDIDATES) {
    const p = join(root, rel);
    if (existsSync(p)) return p;
  }
  return null;
}

function hasOverlayImport(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      if (path.node.source.value === "@nuvio/overlay") found = true;
    },
  });
  return found;
}

function hasDevShell(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    JSXElement(path: NodePath<t.JSXElement>) {
      const name = path.node.openingElement.name;
      if (t.isJSXIdentifier(name) && name.name === "NuvioDevShell") found = true;
    },
  });
  return found;
}

function unwrapJsx(
  node: t.Expression | null | undefined,
): t.JSXElement | t.JSXFragment | null {
  if (!node) return null;
  if (t.isJSXElement(node) || t.isJSXFragment(node)) return node;
  if (t.isParenthesizedExpression(node)) return unwrapJsx(node.expression);
  return null;
}

const devShellElement = t.jsxElement(
  t.jsxOpeningElement(t.jsxIdentifier("NuvioDevShell"), [], true),
  null,
  [],
  true,
);

function appendDevShell(ast: t.File): boolean {
  let patched = false;
  traverse(ast, {
    ReturnStatement(path: NodePath<t.ReturnStatement>) {
      const jsx = unwrapJsx(path.node.argument);
      if (!jsx) return;
      if (t.isJSXFragment(jsx)) {
        jsx.children.push(t.jsxText("\n      "));
        jsx.children.push(devShellElement);
        patched = true;
      } else {
        path.node.argument = t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          [jsx, t.jsxText("\n      "), devShellElement],
        );
        patched = true;
      }
    },
  });
  return patched;
}

export function patchAppRootFile(filePath: string): PatchOutcome {
  const source = readFileSync(filePath, "utf8");
  let ast: t.File;
  try {
    ast = parseTs(source, filePath);
  } catch {
    return { ok: false, error: "parse failed" };
  }

  if (hasOverlayImport(ast) && hasDevShell(ast)) {
    return { ok: true, skipped: true };
  }

  if (!hasOverlayImport(ast)) {
    ast.program.body.unshift(
      t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier("NuvioDevShell"),
            t.identifier("NuvioDevShell"),
          ),
        ],
        t.stringLiteral("@nuvio/overlay"),
      ),
    );
  }

  if (!hasDevShell(ast) && !appendDevShell(ast)) {
    return { ok: false, error: "no JSX return to patch" };
  }

  writeFileSync(filePath, printTs(ast, source), "utf8");
  return { ok: true };
}

export function appHasDevShell(filePath: string): boolean {
  if (!existsSync(filePath)) return false;
  const source = readFileSync(filePath, "utf8");
  try {
    const ast = parseTs(source, filePath);
    return hasOverlayImport(ast) && hasDevShell(ast);
  } catch {
    return /NuvioDevShell/.test(source);
  }
}
