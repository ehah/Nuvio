import { parse } from "@babel/parser";
import type { NodePath, Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const traverse = require("@babel/traverse").default as (ast: t.File, visitor: Visitor) => void;

export function applySetTableDataField(
  ast: t.File,
  arrayName: string,
  rowKey: string,
  field: string,
  value: string,
): void {
  let updated = false;
  traverse(ast, {
    VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
      if (updated || !t.isIdentifier(path.node.id) || path.node.id.name !== arrayName) {
        return;
      }
      if (!t.isArrayExpression(path.node.init)) {
        return;
      }
      for (const el of path.node.init.elements) {
        if (!el || !t.isObjectExpression(el)) {
          continue;
        }
        let idValue: string | null = null;
        for (const prop of el.properties) {
          if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key)) {
            continue;
          }
          if (prop.key.name === "id" && t.isNumericLiteral(prop.value)) {
            idValue = String(prop.value.value);
          }
        }
        if (idValue !== rowKey) {
          continue;
        }
        for (const prop of el.properties) {
          if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key)) {
            continue;
          }
          if (prop.key.name !== field) {
            continue;
          }
          if (t.isStringLiteral(prop.value)) {
            prop.value.value = value;
            updated = true;
            path.stop();
            return;
          }
        }
      }
    },
  });
  if (!updated) {
    throw new Error(
      `No ${arrayName} entry with id=${rowKey} and string field "${field}" found in source`,
    );
  }
}

export function parseSourceFile(source: string, filePath: string): t.File {
  return parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
    sourceFilename: filePath,
  });
}
