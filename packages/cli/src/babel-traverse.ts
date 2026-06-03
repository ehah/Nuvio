import traverseImport from "@babel/traverse";
import type { NodePath } from "@babel/traverse";

type TraverseFn = (
  parent: import("@babel/types").File,
  opts?: {
    enter?: (path: NodePath) => void;
    [key: string]: unknown;
  },
) => void;

const traverse = (
  typeof traverseImport === "function"
    ? traverseImport
    : (traverseImport as { default: TraverseFn }).default
) as TraverseFn;

export default traverse;
export type { NodePath };
