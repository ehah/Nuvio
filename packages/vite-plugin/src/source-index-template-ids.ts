import type { JSXAttribute } from "@babel/types";
import * as t from "@babel/types";

/** Expand `orders.row.${product.id}` → orders.row.1, orders.row.2, … when row keys are known. */
export function expandTemplateNuvioIds(
  attr: JSXAttribute,
  rowKeys: readonly string[],
): string[] {
  if (attr.value?.type !== "JSXExpressionContainer") {
    return [];
  }
  const expr = attr.value.expression;
  if (!t.isTemplateLiteral(expr) || expr.expressions.length !== 1) {
    return [];
  }
  const prefix = expr.quasis[0]?.value.cooked ?? "";
  const suffix = expr.quasis[1]?.value.cooked ?? "";
  if (!prefix) {
    return [];
  }
  const first = expr.expressions[0];
  const mapVarOk =
    (first?.type === "Identifier" &&
      (first.name === "product" || first.name === "item" || first.name === "row")) ||
    (first?.type === "MemberExpression" &&
      !first.computed &&
      first.object.type === "Identifier" &&
      (first.object.name === "product" || first.object.name === "item") &&
      first.property.type === "Identifier" &&
      first.property.name === "id");
  if (!mapVarOk) {
    return [];
  }
  return rowKeys.map((key) => `${prefix}${key}${suffix}`.trim()).filter(Boolean);
}

export function extractRowKeysFromTableDataConst(code: string): string[] {
  const keys: string[] = [];
  const re = /\bid:\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    keys.push(m[1]!);
  }
  return keys;
}
