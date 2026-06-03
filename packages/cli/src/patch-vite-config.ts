import traverse from "./babel-traverse.js";
import type { NodePath } from "./babel-traverse.js";
import * as t from "@babel/types";
import { readFileSync, writeFileSync } from "node:fs";
import { parseTs, printTs } from "./parse-ts.js";

export type PatchOutcome = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function hasNuvioImport(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      if (path.node.source.value === "@nuvio/vite-plugin") found = true;
    },
  });
  return found;
}

function hasNuvioPluginCall(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    CallExpression(path: NodePath<t.CallExpression>) {
      if (t.isIdentifier(path.node.callee, { name: "nuvio" })) found = true;
    },
  });
  return found;
}

function appendNuvioPlugin(ast: t.File): boolean {
  let patched = false;
  traverse(ast, {
    ObjectProperty(path: NodePath<t.ObjectProperty>) {
      if (!t.isIdentifier(path.node.key, { name: "plugins" })) return;
      if (!t.isArrayExpression(path.node.value)) return;
      path.node.value.elements.push(t.callExpression(t.identifier("nuvio"), []));
      patched = true;
    },
  });
  return patched;
}

export function patchViteConfigFile(filePath: string): PatchOutcome {
  const source = readFileSync(filePath, "utf8");
  let ast: t.File;
  try {
    ast = parseTs(source, filePath);
  } catch {
    return { ok: false, error: "parse failed" };
  }

  if (hasNuvioImport(ast) && hasNuvioPluginCall(ast)) {
    return { ok: true, skipped: true };
  }

  if (!hasNuvioImport(ast)) {
    ast.program.body.unshift(
      t.importDeclaration(
        [t.importSpecifier(t.identifier("nuvio"), t.identifier("nuvio"))],
        t.stringLiteral("@nuvio/vite-plugin"),
      ),
    );
  }

  if (!hasNuvioPluginCall(ast)) {
    if (!appendNuvioPlugin(ast)) {
      return { ok: false, error: "no static plugins array" };
    }
  }

  writeFileSync(filePath, printTs(ast, source), "utf8");
  return { ok: true };
}

export function viteConfigHasNuvio(filePath: string): boolean {
  const source = readFileSync(filePath, "utf8");
  try {
    const ast = parseTs(source, filePath);
    return hasNuvioImport(ast) && hasNuvioPluginCall(ast);
  } catch {
    return /nuvio\s*\(/.test(source);
  }
}
