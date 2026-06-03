import generateImport from "@babel/generator";
import type { GeneratorResult } from "@babel/generator";
import type { File } from "@babel/types";

type GenerateFn = (
  ast: File,
  opts?: { retainLines?: boolean },
  source?: string,
) => GeneratorResult;

const generate = (
  typeof generateImport === "function"
    ? generateImport
    : (generateImport as unknown as { default: GenerateFn }).default
) as GenerateFn;

export default generate;
