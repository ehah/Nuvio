import traverse from "./babel-traverse.js";
import type { NodePath } from "./babel-traverse.js";
import * as t from "@babel/types";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseTs, printTs } from "./parse-ts.js";
import type { PatchOutcome } from "./patch-vite-config.js";

const APP_CANDIDATES = [
  "src/pages/_app.tsx",
  "src/pages/_app.jsx",
  "pages/_app.tsx",
  "pages/_app.jsx",
] as const;

const SHELL_IMPORT = "@nuvio/overlay/next";
const STYLE_IMPORT = "@nuvio/overlay/style.css";
const SHELL_NAME = "NuvioNextShell";

const DEFAULT_PAGES_APP = `import type { AppProps } from "next/app";
import "${STYLE_IMPORT}";
import { ${SHELL_NAME} } from "${SHELL_IMPORT}";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <${SHELL_NAME} />
    </>
  );
}
`;

export function resolveNextPagesAppFile(root: string): string | null {
  for (const rel of APP_CANDIDATES) {
    const p = join(root, rel);
    if (existsSync(p)) {
      return p;
    }
  }
  return null;
}

export function defaultNextPagesAppPath(root: string): string {
  if (existsSync(join(root, "src/pages"))) {
    return join(root, "src/pages/_app.tsx");
  }
  return join(root, "pages/_app.tsx");
}

function hasShellImport(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      if (path.node.source.value === SHELL_IMPORT) {
        found = true;
      }
    },
  });
  return found;
}

function hasStyleImport(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
      if (path.node.source.value === STYLE_IMPORT) {
        found = true;
      }
    },
  });
  return found;
}

function hasShellElement(ast: t.File): boolean {
  let found = false;
  traverse(ast, {
    JSXElement(path: NodePath<t.JSXElement>) {
      const name = path.node.openingElement.name;
      if (t.isJSXIdentifier(name) && name.name === SHELL_NAME) {
        found = true;
      }
    },
  });
  return found;
}

const shellElement = t.jsxElement(
  t.jsxOpeningElement(t.jsxIdentifier(SHELL_NAME), [], true),
  null,
  [],
  true,
);

function appendShell(ast: t.File): boolean {
  let patched = false;
  traverse(ast, {
    ReturnStatement(path: NodePath<t.ReturnStatement>) {
      if (patched) {
        return;
      }
      const arg = path.node.argument;
      if (!arg) {
        return;
      }
      if (t.isJSXFragment(arg)) {
        arg.children.push(t.jsxText("\n      "));
        arg.children.push(shellElement);
        patched = true;
        return;
      }
      if (t.isJSXElement(arg)) {
        path.node.argument = t.jsxFragment(
          t.jsxOpeningFragment(),
          t.jsxClosingFragment(),
          [arg, t.jsxText("\n      "), shellElement],
        );
        patched = true;
      }
    },
  });
  return patched;
}

export function patchNextPagesAppFile(filePath: string): PatchOutcome {
  const source = readFileSync(filePath, "utf8");
  let ast: t.File;
  try {
    ast = parseTs(source, filePath);
  } catch {
    return { ok: false, error: "parse failed" };
  }

  if (hasShellImport(ast) && hasShellElement(ast) && hasStyleImport(ast)) {
    return { ok: true, skipped: true };
  }

  if (!hasStyleImport(ast)) {
    ast.program.body.unshift(
      t.importDeclaration([], t.stringLiteral(STYLE_IMPORT)),
    );
  }

  if (!hasShellImport(ast)) {
    ast.program.body.unshift(
      t.importDeclaration(
        [t.importSpecifier(t.identifier(SHELL_NAME), t.identifier(SHELL_NAME))],
        t.stringLiteral(SHELL_IMPORT),
      ),
    );
  }

  if (!hasShellElement(ast) && !appendShell(ast)) {
    return { ok: false, error: "no JSX return to patch" };
  }

  writeFileSync(filePath, printTs(ast, source), "utf8");
  return { ok: true };
}

export function ensureNextPagesApp(root: string): {
  outcome: PatchOutcome;
  filePath: string;
  created: boolean;
} {
  const existing = resolveNextPagesAppFile(root);
  if (existing) {
    return {
      outcome: patchNextPagesAppFile(existing),
      filePath: existing,
      created: false,
    };
  }
  const filePath = defaultNextPagesAppPath(root);
  writeFileSync(filePath, DEFAULT_PAGES_APP, "utf8");
  return { outcome: { ok: true }, filePath, created: true };
}
