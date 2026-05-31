import { createRequire } from "node:module";
import path from "node:path";
import { parse } from "@babel/parser";
import type { NodePath, Visitor } from "@babel/traverse";
import * as t from "@babel/types";
import prettier from "prettier";
import { twMerge } from "tailwind-merge";
import type { PatchOp } from "@nuvio/shared";
import { validateTailwindFragment } from "./tailwind-whitelist.js";
import { applySetTableDataField } from "./set-table-data-field.js";

export type ClassNameMode = "literal-only" | "cn-basic";
export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";

const require = createRequire(import.meta.url);
const traverse = require("@babel/traverse").default as (ast: t.File, visitor: Visitor) => void;
const generate = require("@babel/generator").default as (
  ast: t.Node,
  opts?: Record<string, unknown>,
) => { code: string };

function extractRowKeysFromSource(ast: t.File): string[] {
  const keys: string[] = [];
  traverse(ast, {
    VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
      if (!t.isIdentifier(path.node.id) || path.node.id.name !== "tableData") {
        return;
      }
      if (!t.isArrayExpression(path.node.init)) {
        return;
      }
      for (const el of path.node.init.elements) {
        if (!el || !t.isObjectExpression(el)) {
          continue;
        }
        for (const prop of el.properties) {
          if (
            t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key, { name: "id" }) &&
            t.isNumericLiteral(prop.value)
          ) {
            keys.push(String(prop.value.value));
          }
        }
      }
    },
  });
  return keys;
}

function templateLiteralMatchesHostId(attr: t.JSXAttribute, hostId: string, rowKeys: string[]): boolean {
  if (!t.isJSXExpressionContainer(attr.value)) {
    return false;
  }
  const expr = attr.value.expression;
  if (!t.isTemplateLiteral(expr) || expr.expressions.length !== 1) {
    return false;
  }
  const ex = expr.expressions[0];
  const mapOk =
    t.isIdentifier(ex, { name: "product" }) ||
    t.isIdentifier(ex, { name: "item" }) ||
    (t.isMemberExpression(ex) &&
      !ex.computed &&
      t.isIdentifier(ex.object, { name: "product" }) &&
      t.isIdentifier(ex.property, { name: "id" }));
  if (!mapOk) {
    return false;
  }
  const prefix = expr.quasis[0]?.value.cooked ?? "";
  const suffix = expr.quasis[1]?.value.cooked ?? "";
  return rowKeys.some((key) => `${prefix}${key}${suffix}` === hostId);
}

function findHostOpening(
  ast: t.File,
  hostId: string,
): NodePath<t.JSXOpeningElement> | null {
  const rowKeys = extractRowKeysFromSource(ast);
  let found: NodePath<t.JSXOpeningElement> | null = null;
  traverse(ast, {
    JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
      for (const attr of path.node.attributes) {
        if (!t.isJSXAttribute(attr)) {
          continue;
        }
        if (!t.isJSXIdentifier(attr.name, { name: "data-nuvio-id" })) {
          continue;
        }
        if (t.isStringLiteral(attr.value) && attr.value.value === hostId) {
          found = path;
          path.stop();
          return;
        }
        if (rowKeys.length > 0 && templateLiteralMatchesHostId(attr, hostId, rowKeys)) {
          found = path;
          path.stop();
          return;
        }
      }
    },
  });
  return found;
}

function applySetText(openingPath: NodePath<t.JSXOpeningElement>, text: string): void {
  const parent = openingPath.parentPath;
  if (!parent?.isJSXElement()) {
    throw new Error("Host is not a JSX element");
  }
  const jsx = parent as NodePath<t.JSXElement>;
  const { children } = jsx.node;

  if (children.length === 0) {
    jsx.node.children = [t.jsxText(text)];
    return;
  }

  if (children.length === 1 && t.isJSXText(children[0])) {
    children[0].value = text;
    return;
  }

  if (
    children.length === 1 &&
    t.isJSXExpressionContainer(children[0]) &&
    t.isStringLiteral(children[0].expression)
  ) {
    children[0].expression.value = text;
    return;
  }

  // Replace rich / mixed children with a single text node (drops inline markup).
  jsx.node.children = [t.jsxText(text)];
}

type ClassNameBinding = {
  read(): string;
  write(next: string): void;
};

type BreakpointBuckets = {
  base: string[];
  sm: string[];
  md: string[];
  lg: string[];
  xl: string[];
  passthrough: string[];
};

function emptyBreakpointBuckets(): BreakpointBuckets {
  return {
    base: [],
    sm: [],
    md: [],
    lg: [],
    xl: [],
    passthrough: [],
  };
}

function classifyTokenByBreakpoint(token: string): { bp: Breakpoint | "passthrough"; value: string } {
  if (!token.includes(":")) {
    return { bp: "base", value: token };
  }
  const m = token.match(/^(sm|md|lg|xl):(.*)$/);
  if (!m) {
    return { bp: "passthrough", value: token };
  }
  if (!m[2] || m[2].includes(":")) {
    return { bp: "passthrough", value: token };
  }
  return { bp: m[1] as Breakpoint, value: m[2] };
}

export function parseClassNameByBreakpoint(className: string): BreakpointBuckets {
  const buckets = emptyBreakpointBuckets();
  const tokens = className.trim().split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const parsed = classifyTokenByBreakpoint(tok);
    if (parsed.bp === "passthrough") {
      buckets.passthrough.push(parsed.value);
      continue;
    }
    buckets[parsed.bp].push(parsed.value);
  }
  return buckets;
}

function prefixTokenForBreakpoint(token: string, bp: Breakpoint): string {
  return bp === "base" ? token : `${bp}:${token}`;
}

export function mergeAtBreakpoint(
  className: string,
  fragment: string,
  activeBreakpoint: Breakpoint,
): string {
  const buckets = parseClassNameByBreakpoint(className);
  const incomingBuckets = emptyBreakpointBuckets();
  for (const tok of fragment.trim().split(/\s+/).filter(Boolean)) {
    const parsed = classifyTokenByBreakpoint(tok);
    if (parsed.bp === "passthrough") {
      incomingBuckets.passthrough.push(parsed.value);
      continue;
    }
    const targetBp = parsed.bp === "base" ? activeBreakpoint : parsed.bp;
    incomingBuckets[targetBp].push(parsed.value);
  }

  const mergedBase = twMerge(buckets.base.join(" "), incomingBuckets.base.join(" ")).trim();
  const mergedSm = twMerge(buckets.sm.join(" "), incomingBuckets.sm.join(" ")).trim();
  const mergedMd = twMerge(buckets.md.join(" "), incomingBuckets.md.join(" ")).trim();
  const mergedLg = twMerge(buckets.lg.join(" "), incomingBuckets.lg.join(" ")).trim();
  const mergedXl = twMerge(buckets.xl.join(" "), incomingBuckets.xl.join(" ")).trim();

  const out: string[] = [];
  if (mergedBase) {
    out.push(mergedBase);
  }
  if (mergedSm) {
    out.push(
      ...mergedSm
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => prefixTokenForBreakpoint(t, "sm")),
    );
  }
  if (mergedMd) {
    out.push(
      ...mergedMd
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => prefixTokenForBreakpoint(t, "md")),
    );
  }
  if (mergedLg) {
    out.push(
      ...mergedLg
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => prefixTokenForBreakpoint(t, "lg")),
    );
  }
  if (mergedXl) {
    out.push(
      ...mergedXl
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => prefixTokenForBreakpoint(t, "xl")),
    );
  }
  out.push(...buckets.passthrough, ...incomingBuckets.passthrough);
  return out.join(" ").trim();
}

function getClassNameBinding(
  opening: t.JSXOpeningElement,
  classNameMode: ClassNameMode,
): ClassNameBinding | null {
  for (const attr of opening.attributes) {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: "className" })) {
      if (t.isStringLiteral(attr.value)) {
        const literal = attr.value;
        return {
          read: () => literal.value,
          write: (next) => {
            attr.value = t.stringLiteral(next);
          },
        };
      }
      if (
        classNameMode === "cn-basic" &&
        t.isJSXExpressionContainer(attr.value) &&
        t.isCallExpression(attr.value.expression) &&
        ((t.isIdentifier(attr.value.expression.callee) &&
          (attr.value.expression.callee.name === "cn" ||
            attr.value.expression.callee.name === "clsx")) ||
          false)
      ) {
        const call = attr.value.expression;
        if (call.arguments.every((arg) => t.isStringLiteral(arg))) {
          return {
            read: () => call.arguments.map((arg) => (arg as t.StringLiteral).value).join(" "),
            write: (next) => {
              call.arguments = [t.stringLiteral(next)];
            },
          };
        }
      }
      return null;
    }
  }
  return {
    read: () => "",
    write: (next) => {
      opening.attributes.push(
        t.jsxAttribute(t.jsxIdentifier("className"), t.stringLiteral(next)),
      );
    },
  };
}

function parentSupportsLayoutMoves(parentOpening: t.JSXOpeningElement): boolean {
  const binding = getClassNameBinding(parentOpening, "literal-only");
  if (!binding) {
    return false;
  }
  const cls = binding.read();
  return /\b(flex|inline-flex|grid|inline-grid)\b/.test(cls) || /\b(flex-|grid-)/.test(cls);
}

function collectJsxElementChildIndices(parent: t.JSXElement): number[] {
  const indices: number[] = [];
  parent.children.forEach((child, i) => {
    if (t.isJSXElement(child)) {
      indices.push(i);
    }
  });
  return indices;
}

function applyMoveSibling(
  openingPath: NodePath<t.JSXOpeningElement>,
  direction: "up" | "down",
): void {
  const hostPath = openingPath.parentPath;
  if (!hostPath?.isJSXElement()) {
    throw new Error("Host is not a JSX element");
  }
  const parentPath = hostPath.parentPath;
  if (!parentPath?.isJSXElement()) {
    throw new Error("Move requires a JSX element parent (same flex/grid container)");
  }
  const parentOpening = parentPath.node.openingElement;
  if (!parentSupportsLayoutMoves(parentOpening)) {
    throw new Error(
      "Parent must use flex or grid layout (string-literal className with flex/grid utilities)",
    );
  }

  const parent = parentPath.node;
  const jsxIndices = collectJsxElementChildIndices(parent);
  const hostIndex = parent.children.indexOf(hostPath.node);
  if (hostIndex < 0) {
    throw new Error("Host not found in parent children");
  }
  const pos = jsxIndices.indexOf(hostIndex);
  if (pos < 0) {
    throw new Error("Host must be a direct JSX element child of the layout parent");
  }
  if (direction === "up" && pos === 0) {
    throw new Error("Already the first sibling");
  }
  if (direction === "down" && pos === jsxIndices.length - 1) {
    throw new Error("Already the last sibling");
  }

  const swapIndex =
    direction === "up" ? jsxIndices[pos - 1]! : jsxIndices[pos + 1]!;
  const hostNode = parent.children[hostIndex]!;
  parent.children[hostIndex] = parent.children[swapIndex]!;
  parent.children[swapIndex] = hostNode;
}

function applySetHidden(
  openingPath: NodePath<t.JSXOpeningElement>,
  hidden: boolean,
  classNameMode: ClassNameMode,
  activeBreakpoint: Breakpoint,
): void {
  if (hidden) {
    applyMergeClassName(openingPath, "hidden", classNameMode, activeBreakpoint);
    return;
  }
  const opening = openingPath.node;
  let clsAttr: t.JSXAttribute | undefined;
  for (const attr of opening.attributes) {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: "className" })) {
      clsAttr = attr;
      break;
    }
  }
  if (!clsAttr || !t.isStringLiteral(clsAttr.value)) {
    return;
  }
  const tokens = clsAttr.value.value.split(/\s+/).filter((tok) => tok && tok !== "hidden");
  clsAttr.value = t.stringLiteral(twMerge(tokens.join(" ")));
}

function collectNuvioIds(ast: t.File): Set<string> {
  const ids = new Set<string>();
  traverse(ast, {
    JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
      for (const attr of path.node.attributes) {
        if (!t.isJSXAttribute(attr) || !t.isJSXIdentifier(attr.name, { name: "data-nuvio-id" })) {
          continue;
        }
        if (t.isStringLiteral(attr.value)) {
          ids.add(attr.value.value);
        }
      }
    },
  });
  return ids;
}

function setNuvioIdOnOpening(opening: t.JSXOpeningElement, id: string): void {
  for (const attr of opening.attributes) {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: "data-nuvio-id" })) {
      if (t.isStringLiteral(attr.value)) {
        attr.value.value = id;
        return;
      }
    }
  }
  opening.attributes.push(
    t.jsxAttribute(t.jsxIdentifier("data-nuvio-id"), t.stringLiteral(id)),
  );
}

function remapDescendantNuvioIds(element: t.JSXElement, taken: Set<string>): void {
  const stack: t.JSXElement[] = [];
  for (const child of element.children) {
    if (t.isJSXElement(child)) {
      stack.push(child);
    }
  }
  while (stack.length > 0) {
    const el = stack.pop()!;
    for (const attr of el.openingElement.attributes) {
      if (
        !t.isJSXAttribute(attr) ||
        !t.isJSXIdentifier(attr.name, { name: "data-nuvio-id" }) ||
        !t.isStringLiteral(attr.value)
      ) {
        continue;
      }
      const nextId = uniqueDuplicateId(attr.value.value, taken);
      attr.value.value = nextId;
      taken.add(nextId);
    }
    for (const child of el.children) {
      if (t.isJSXElement(child)) {
        stack.push(child);
      }
    }
  }
}

function uniqueDuplicateId(baseId: string, taken: Set<string>): string {
  const candidate = `${baseId}.copy`;
  if (!taken.has(candidate)) {
    return candidate;
  }
  let n = 2;
  while (taken.has(`${baseId}.copy${n}`)) {
    n += 1;
  }
  return `${baseId}.copy${n}`;
}

function applyDuplicateHost(
  ast: t.File,
  openingPath: NodePath<t.JSXOpeningElement>,
  hostId: string,
): string {
  const hostPath = openingPath.parentPath;
  if (!hostPath?.isJSXElement()) {
    throw new Error("Host is not a JSX element");
  }
  const parentPath = hostPath.parentPath;
  if (!parentPath?.isJSXElement()) {
    throw new Error("Duplicate requires a JSX element parent");
  }
  const taken = collectNuvioIds(ast);
  const newId = uniqueDuplicateId(hostId, taken);
  const clone = t.cloneNode(hostPath.node, true);
  if (!t.isJSXElement(clone)) {
    throw new Error("Failed to clone host element");
  }
  setNuvioIdOnOpening(clone.openingElement, newId);
  taken.add(newId);
  remapDescendantNuvioIds(clone, taken);
  const parent = parentPath.node;
  const hostIndex = parent.children.indexOf(hostPath.node);
  if (hostIndex < 0) {
    throw new Error("Host not found in parent children");
  }
  parent.children.splice(hostIndex + 1, 0, clone);
  return newId;
}

function applyMergeClassName(
  openingPath: NodePath<t.JSXOpeningElement>,
  fragment: string,
  classNameMode: ClassNameMode,
  activeBreakpoint: Breakpoint,
): void {
  validateTailwindFragment(fragment);
  const opening = openingPath.node;
  const binding = getClassNameBinding(opening, classNameMode);
  if (!binding) {
    throw new Error(
      classNameMode === "cn-basic"
        ? "className must be a string literal or simple cn()/clsx() string list in cn-basic mode"
        : "className must be a string literal for Phase 2 patches",
    );
  }
  const current = binding.read();
  binding.write(mergeAtBreakpoint(current, fragment.trim(), activeBreakpoint));
}

export type ApplyPatchToSourceResult =
  | { ok: true; source: string; diffSummary: string }
  | { ok: false; code: string; message: string };

/**
 * Apply Phase 2 patch operations to TSX/JSX source for a single `data-nuvio-id` host.
 */
export async function applyPatchToSource(
  source: string,
  filePath: string,
  hostId: string,
  ops: readonly PatchOp[],
  options?: { classNameMode?: ClassNameMode; activeBreakpoint?: Breakpoint },
): Promise<ApplyPatchToSourceResult> {
  const classNameMode: ClassNameMode = options?.classNameMode ?? "literal-only";
  const activeBreakpoint: Breakpoint = options?.activeBreakpoint ?? "base";
  let ast: t.File;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
      sourceFilename: filePath,
    });
  } catch (e) {
    return { ok: false, code: "parse_error", message: String(e) };
  }

  const tableDataOps = ops.filter((o) => o.kind === "setTableDataField");
  const hostOps = ops.filter((o) => o.kind !== "setTableDataField");

  const openingPath =
    hostOps.length > 0 ? findHostOpening(ast, hostId) : tableDataOps.length > 0 ? null : findHostOpening(ast, hostId);

  if (hostOps.length > 0 && !openingPath) {
    return { ok: false, code: "host_not_found", message: `No JSX host with data-nuvio-id="${hostId}"` };
  }
  if (ops.length === 0) {
    return { ok: false, code: "patch_rejected", message: "No patch operations" };
  }
  if (hostOps.length === 0 && tableDataOps.length === 0) {
    return { ok: false, code: "host_not_found", message: `No JSX host with data-nuvio-id="${hostId}"` };
  }

  let duplicateNewId: string | undefined;

  try {
    for (const op of ops) {
      if (op.kind === "setTableDataField") {
        applySetTableDataField(ast, op.arrayName, op.rowKey, op.field, op.value);
      } else if (op.kind === "setText") {
        if (!openingPath) {
          throw new Error("setText requires a JSX host");
        }
        applySetText(openingPath, op.text);
      } else if (op.kind === "mergeTailwindClassName") {
        if (!openingPath) {
          throw new Error("mergeTailwindClassName requires a JSX host");
        }
        applyMergeClassName(openingPath, op.classNameFragment, classNameMode, activeBreakpoint);
      } else if (op.kind === "moveSibling") {
        if (!openingPath) {
          throw new Error("moveSibling requires a JSX host");
        }
        applyMoveSibling(openingPath, op.direction);
      } else if (op.kind === "setHidden") {
        if (!openingPath) {
          throw new Error("setHidden requires a JSX host");
        }
        applySetHidden(openingPath, op.hidden, classNameMode, activeBreakpoint);
      } else if (op.kind === "duplicateHost") {
        if (!openingPath) {
          throw new Error("duplicateHost requires a JSX host");
        }
        duplicateNewId = applyDuplicateHost(ast, openingPath, hostId);
      }
    }
  } catch (e) {
    return { ok: false, code: "patch_rejected", message: String(e) };
  }

  let raw: string;
  try {
    raw = generate(ast, { retainLines: false, comments: true }).code;
  } catch (e) {
    return { ok: false, code: "generate_error", message: String(e) };
  }

  let formatted: string;
  try {
    formatted = await prettier.format(raw, {
      parser: "typescript",
      filepath: filePath,
    });
  } catch (e) {
    return { ok: false, code: "format_error", message: String(e) };
  }

  const base = path.basename(filePath);
  const opBits = ops.map((op) => {
    switch (op.kind) {
      case "setText":
        return `set text (${op.text.length} char${op.text.length === 1 ? "" : "s"})`;
      case "mergeTailwindClassName":
        return `merge className (${op.classNameFragment.trim()})`;
      case "moveSibling":
        return `move sibling ${op.direction}`;
      case "setHidden":
        return op.hidden ? "hide element" : "show element";
      case "duplicateHost":
        return duplicateNewId ? `duplicate host → ${duplicateNewId}` : "duplicate host";
      case "setTableDataField":
        return `update ${op.arrayName}[${op.rowKey}].${op.field}`;
    }
  });
  const diffSummary = `${base}: ${opBits.join("; ")}`;

  return { ok: true, source: formatted, diffSummary };
}
