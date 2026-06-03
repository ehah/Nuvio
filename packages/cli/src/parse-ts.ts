import generate from "./babel-generator.js";
import { parse } from "@babel/parser";
import type { File } from "@babel/types";

const PARSE_OPTS = {
  sourceType: "module" as const,
  plugins: ["typescript", "jsx"] as ("typescript" | "jsx")[],
};

export function parseTs(source: string, filename = "file.tsx"): File {
  return parse(source, {
    ...PARSE_OPTS,
    sourceFilename: filename,
  });
}

export function printTs(ast: File, source: string): string {
  const out = generate(ast, { retainLines: true }, source);
  return out.code.endsWith("\n") ? out.code : `${out.code}\n`;
}
