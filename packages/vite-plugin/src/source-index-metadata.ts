import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { IndexWireEntry, RiskLevel } from "@nuvio/shared";
import type { JSXElement, JSXOpeningElement } from "@babel/types";
import {
  collectStyleTargets,
  collectTextTargets,
  pickPrimaryTextTargetKey,
  resolveEntryPatchHostId,
} from "./source-index-text-targets.js";

const NATIVE_TAG = /^[a-z][\w-]*$/;
export type ClassNameMode = "literal-only" | "cn-basic";

export type AnalyzeHostContext = {
  tagName: string;
  componentName?: string;
  hasLiteralClassName: boolean;
  classNameValue?: string;
  classNameComputed: boolean;
  insideMap: boolean;
  textEditable: boolean;
};

function getTagName(opening: JSXOpeningElement): string {
  if (opening.name.type === "JSXIdentifier") {
    return opening.name.name;
  }
  if (opening.name.type === "JSXMemberExpression") {
    const obj =
      opening.name.object.type === "JSXIdentifier" ? opening.name.object.name : "X";
    const prop = opening.name.property.name;
    return `${obj}.${prop}`;
  }
  return "unknown";
}

function readClassName(opening: JSXOpeningElement): {
  hasLiteralClassName: boolean;
  classNameValue?: string;
  classNameComputed: boolean;
} {
  for (const attr of opening.attributes) {
    if (attr.type !== "JSXAttribute" || attr.name.type !== "JSXIdentifier") {
      continue;
    }
    if (attr.name.name !== "className") {
      continue;
    }
    if (attr.value?.type === "StringLiteral") {
      return {
        hasLiteralClassName: true,
        classNameValue: attr.value.value,
        classNameComputed: false,
      };
    }
    return { hasLiteralClassName: false, classNameComputed: true };
  }
  return { hasLiteralClassName: false, classNameComputed: false };
}

function readClassNameWithMode(
  opening: JSXOpeningElement,
  classNameMode: ClassNameMode,
): {
  hasLiteralClassName: boolean;
  classNameValue?: string;
  classNameComputed: boolean;
} {
  const direct = readClassName(opening);
  if (direct.hasLiteralClassName || classNameMode !== "cn-basic") {
    return direct;
  }
  for (const attr of opening.attributes) {
    if (
      attr.type !== "JSXAttribute" ||
      attr.name.type !== "JSXIdentifier" ||
      attr.name.name !== "className"
    ) {
      continue;
    }
    if (
      attr.value?.type === "JSXExpressionContainer" &&
      attr.value.expression.type === "CallExpression" &&
      attr.value.expression.callee.type === "Identifier" &&
      (attr.value.expression.callee.name === "cn" ||
        attr.value.expression.callee.name === "clsx") &&
      attr.value.expression.arguments.every((arg) => arg.type === "StringLiteral")
    ) {
      return {
        hasLiteralClassName: true,
        classNameValue: attr.value.expression.arguments
          .map((arg) => (arg as t.StringLiteral).value)
          .join(" "),
        classNameComputed: false,
      };
    }
  }
  return direct;
}

function isInsideMap(path: NodePath<JSXOpeningElement>): boolean {
  let p: NodePath | null = path.parentPath;
  while (p) {
    if (p.isCallExpression()) {
      const callee = p.node.callee;
      if (
        t.isMemberExpression(callee) &&
        !callee.computed &&
        t.isIdentifier(callee.property) &&
        callee.property.name === "map"
      ) {
        return true;
      }
    }
    p = p.parentPath;
  }
  return false;
}

function findEnclosingComponentName(path: NodePath<JSXOpeningElement>): string | undefined {
  let p: NodePath | null = path.parentPath;
  while (p) {
    if (p.isFunctionDeclaration()) {
      const id = p.node.id;
      if (id?.type === "Identifier") {
        return id.name;
      }
    }
    if (p.isArrowFunctionExpression() || p.isFunctionExpression()) {
      const parent = p.parentPath;
      if (parent?.isVariableDeclarator()) {
        const id = parent.node.id;
        if (id?.type === "Identifier") {
          return id.name;
        }
      }
    }
    p = p.parentPath;
  }
  return undefined;
}

function jsxElementHasElementChildren(el: JSXElement): boolean {
  for (const child of el.children) {
    if (child.type === "JSXElement" || child.type === "JSXFragment") {
      return true;
    }
  }
  return false;
}

function readNuvioId(opening: JSXOpeningElement): string | undefined {
  for (const attr of opening.attributes) {
    if (
      attr.type === "JSXAttribute" &&
      attr.name.type === "JSXIdentifier" &&
      attr.name.name === "data-nuvio-id" &&
      attr.value?.type === "StringLiteral"
    ) {
      const id = attr.value.value.trim();
      return id || undefined;
    }
  }
  return undefined;
}

function findParentHostId(openingPath: NodePath<JSXOpeningElement>, id: string): string | undefined {
  let p: NodePath | null = openingPath.parentPath;
  while (p) {
    if (p.isJSXElement() && p.node.openingElement) {
      const parentId = readNuvioId(p.node.openingElement);
      if (parentId && parentId !== id) {
        return parentId;
      }
    }
    p = p.parentPath;
  }
  return undefined;
}

function collectChildHostIds(openingPath: NodePath<JSXOpeningElement>, id: string): string[] {
  const elPath = openingPath.parentPath;
  if (!elPath?.isJSXElement()) {
    return [];
  }
  const childIds = new Set<string>();
  elPath.traverse({
    JSXOpeningElement(innerPath) {
      if (innerPath === openingPath) {
        return;
      }
      const childId = readNuvioId(innerPath.node);
      if (childId && childId !== id) {
        childIds.add(childId);
      }
    },
  });
  return [...childIds].sort();
}

function inferHierarchyRole(
  ctx: AnalyzeHostContext,
  hostId?: string,
): "section" | "card" | "table" | "form" | "group" | "layout" | "text" | "button" | "input" | "media" | "unknown" {
  const tag = ctx.tagName.toLowerCase();
  const cls = ctx.classNameValue ?? "";
  const id = hostId ?? "";
  if (
    id.endsWith(".table") ||
    id.endsWith(".section") ||
    id.includes(".header.") ||
    /\.row\./.test(id)
  ) {
    return "table";
  }
  if (tag.includes("table")) {
    return "table";
  }
  if (tag === "form") {
    return "form";
  }
  if (tag === "button" || tag === "a") {
    return "button";
  }
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return "input";
  }
  if (tag === "img" || tag === "svg" || tag === "video") {
    return "media";
  }
  if (/^h[1-6]$/.test(tag) || tag === "p" || tag === "span" || tag === "label") {
    return "text";
  }
  if (/\b(grid|flex|items-|justify-|gap-)\b/.test(cls)) {
    return "layout";
  }
  if (/\b(rounded-|shadow|border|bg-)\b/.test(cls) && /\bp(?:x|y|t|r|b|l)?-\d/.test(cls)) {
    return "card";
  }
  if (tag === "section" || tag === "article" || tag === "main") {
    return "section";
  }
  if (tag === "div" || tag === "ul" || tag === "li") {
    return "group";
  }
  return "unknown";
}

export function analyzeHost(
  openingPath: NodePath<JSXOpeningElement>,
  classNameMode: ClassNameMode = "literal-only",
): AnalyzeHostContext | null {
  const opening = openingPath.node;
  const parent = openingPath.parentPath;
  if (!parent?.isJSXElement()) {
    return null;
  }
  const tagName = getTagName(opening);
  const classInfo = readClassNameWithMode(opening, classNameMode);
  const insideMap = isInsideMap(openingPath);
  const textEditable = !jsxElementHasElementChildren(parent.node);
  return {
    tagName,
    componentName: findEnclosingComponentName(openingPath),
    hasLiteralClassName: classInfo.hasLiteralClassName,
    classNameValue: classInfo.classNameValue,
    classNameComputed: classInfo.classNameComputed,
    insideMap,
    textEditable,
  };
}

export function computeRiskMetadata(ctx: AnalyzeHostContext): {
  riskLevel: RiskLevel;
  unsupportedReasons: string[];
  textEditable: boolean;
  structuralEditable: boolean;
} {
  const unsupportedReasons: string[] = [];
  let riskLevel: RiskLevel = "safe";
  const isNative = NATIVE_TAG.test(ctx.tagName);

  const setRisk = (level: RiskLevel) => {
    if (level === "unsupported") {
      riskLevel = "unsupported";
    } else if (level === "caution" && riskLevel !== "unsupported") {
      riskLevel = "caution";
    }
  };

  if (ctx.classNameComputed) {
    setRisk("unsupported");
    unsupportedReasons.push(
      "className is not a string literal — only literal className strings are patchable in this version.",
    );
  }

  if (ctx.insideMap) {
    setRisk("caution");
    unsupportedReasons.push(
      "Element is inside a .map() — text/class changes may affect every rendered item.",
    );
  }

  if (!isNative) {
    setRisk("caution");
    unsupportedReasons.push(
      "Custom React component — className must forward to a DOM node for visual changes.",
    );
  }

  let textEditable = ctx.textEditable;
  if (!textEditable) {
    setRisk("caution");
    unsupportedReasons.push(
      "Text editing applies to leaf elements (h1, p, button) without nested JSX children.",
    );
  }

  if (ctx.hasLiteralClassName && ctx.classNameValue?.includes("dark:")) {
    setRisk("caution");
    unsupportedReasons.push("Responsive/dark: utilities present — edit with care.");
  }

  const structuralEditable =
    (riskLevel === "safe" || riskLevel === "caution") &&
    !ctx.insideMap &&
    !ctx.classNameComputed;

  return {
    riskLevel,
    unsupportedReasons,
    textEditable,
    structuralEditable,
  };
}

export function buildIndexEntry(
  base: { id: string; file: string; line: number; column: number },
  ctx: AnalyzeHostContext,
  openingPath?: NodePath<JSXOpeningElement>,
): IndexWireEntry {
  const risk = computeRiskMetadata(ctx);
  const textTargets =
    openingPath !== undefined
      ? collectTextTargets(openingPath, base.id, ctx, base.file)
      : undefined;
  const styleTargets =
    openingPath !== undefined
      ? collectStyleTargets(openingPath, base.id, ctx, base.file)
      : undefined;
  const patchHostId =
    textTargets && textTargets.length > 0
      ? resolveEntryPatchHostId(base.id, ctx, textTargets)
      : base.id;
  const primaryTextTargetKey =
    textTargets && textTargets.length > 0
      ? pickPrimaryTextTargetKey(textTargets)
      : risk.textEditable
        ? base.id
        : undefined;

  const parentHostId =
    openingPath !== undefined ? findParentHostId(openingPath, base.id) : undefined;
  const childTargetIds =
    openingPath !== undefined ? collectChildHostIds(openingPath, base.id) : [];

  return {
    ...base,
    tagName: ctx.tagName,
    componentName: ctx.componentName,
    hasLiteralClassName: ctx.hasLiteralClassName,
    classNameValue: ctx.classNameValue,
    textEditable: risk.textEditable,
    structuralEditable: risk.structuralEditable,
    riskLevel: risk.riskLevel,
    unsupportedReasons: risk.unsupportedReasons,
    insideMap: ctx.insideMap,
    hierarchyRole: inferHierarchyRole(ctx, base.id),
    parentHostId,
    childTargetIds: childTargetIds.length > 0 ? childTargetIds : undefined,
    patchHostId,
    primaryTextTargetKey,
    textTargets: textTargets && textTargets.length > 0 ? textTargets : undefined,
    styleTargets: styleTargets && styleTargets.length > 0 ? styleTargets : undefined,
  };
}
