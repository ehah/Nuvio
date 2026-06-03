import traverse from "./babel-traverse.js";
import type { NodePath } from "./babel-traverse.js";
import * as t from "@babel/types";
import { readFileSync, writeFileSync } from "node:fs";
import type { PatchOutcome } from "./patch-vite-config.js";
import { findHeadingFiles } from "./scan-ids.js";
import { parseTs, printTs } from "./parse-ts.js";

function patchFirstHeading(filePath: string): PatchOutcome {
  const source = readFileSync(filePath, "utf8");
  let ast: t.File;
  try {
    ast = parseTs(source, filePath);
  } catch {
    return { ok: false, error: "parse failed" };
  }

  let patched = false;
  traverse(ast, {
    JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
      if (patched) return;
      const name = path.node.name;
      if (!t.isJSXIdentifier(name)) return;
      if (name.name !== "h1" && name.name !== "h2") return;
      for (const attr of path.node.attributes) {
        if (
          t.isJSXAttribute(attr) &&
          t.isJSXIdentifier(attr.name, { name: "data-nuvio-id" })
        ) {
          return;
        }
      }
      path.node.attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier("data-nuvio-id"),
          t.stringLiteral("page.title"),
        ),
      );
      patched = true;
    },
  });

  if (!patched) return { ok: false, error: "no h1/h2" };

  writeFileSync(filePath, printTs(ast, source), "utf8");
  return { ok: true };
}

export function patchStarterId(root: string): {
  outcome: PatchOutcome;
  file?: string;
} {
  const files = findHeadingFiles(root);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (!/<h[12][\s>]/.test(source) && !/<>[\s\S]*<h[12]/.test(source)) {
      try {
        const ast = parseTs(source, file);
        let has = false;
        traverse(ast, {
          JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
            const name = path.node.name;
            if (t.isJSXIdentifier(name) && (name.name === "h1" || name.name === "h2"))
              has = true;
          },
        });
        if (!has) continue;
      } catch {
        continue;
      }
    }
    const outcome = patchFirstHeading(file);
    if (outcome.ok) return { outcome, file };
  }
  return { outcome: { ok: false, error: "no heading" } };
}
