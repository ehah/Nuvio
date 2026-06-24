import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { insertDataNuvioIdAtLocation } from "@nuvio/ast-engine";
import {
  injectJsxLocAttributes,
  parseNuvioLocValue,
} from "@nuvio/vite-plugin/jsx-loc";
import { afterEach, describe, expect, it } from "vitest";
import { resolveTargetApps } from "../src/app-context.js";
import { PreflightError } from "../src/detect-project.js";
import {
  ensureNextPagesApp,
  patchNextPagesAppFile,
  resolveNextPagesAppFile,
} from "../src/patch-next-pages-app.js";
import { projectHasPageTitleId } from "../src/scan-ids.js";
import { runInit } from "../src/init.js";
import { verifyNextProject } from "../src/verify-next.js";
import { cleanup, copyFixture } from "./helpers.js";

const dirs: string[] = [];

function fixture(name: string): string {
  const dir = copyFixture(name);
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  while (dirs.length) cleanup(dirs.pop()!);
});

describe("Pages Router init", () => {
  it("creates pages/_app.tsx with NuvioNextShell", () => {
    const root = fixture("next-pages-router-minimal");
    const { outcome, filePath, created } = ensureNextPagesApp(root);
    expect(outcome.ok).toBe(true);
    expect(created).toBe(true);
    const text = readFileSync(filePath, "utf8");
    expect(text).toContain("NuvioNextShell");
    expect(text).toContain("@nuvio/overlay/next");
  });

  it("patches existing _app idempotently", () => {
    const root = fixture("next-pages-router-minimal");
    ensureNextPagesApp(root);
    const pagesApp = resolveNextPagesAppFile(root)!;
    const before = readFileSync(pagesApp, "utf8");
    const result = patchNextPagesAppFile(pagesApp);
    expect(result.ok).toBe(true);
    expect(readFileSync(pagesApp, "utf8")).toBe(before);
  });

  it("wires Pages Router fixture with runInit", async () => {
    const root = fixture("next-pages-router-minimal");
    const code = await runInit({
      cwd: root,
      yes: true,
      noInstall: true,
    });
    expect(code).toBe(0);
    const pagesApp = resolveNextPagesAppFile(root)!;
    expect(readFileSync(pagesApp, "utf8")).toContain("NuvioNextShell");
    expect(projectHasPageTitleId(root)).toBe(true);

    const verification = verifyNextProject(
      root,
      join(root, "package.json"),
      "pages",
    );
    expect(verification.shell).toBe("OK");
    expect(verification.starterId).toBe("OK");
    expect(existsSync(join(root, "server.js"))).toBe(true);
  });
});

describe("backend-only repo", () => {
  it("rejects init when only backend markers exist", async () => {
    const root = fixture("backend-only-repo");
    expect(() => resolveTargetApps({ cwd: root })).toThrow(PreflightError);
    try {
      resolveTargetApps({ cwd: root });
    } catch (e) {
      expect(e).toBeInstanceOf(PreflightError);
      expect((e as PreflightError).message).toContain("Backend paths were ignored");
    }

    const code = await runInit({ cwd: root, yes: true, noInstall: true });
    expect(code).toBe(1);
  });
});

describe("Next click-to-tag", () => {
  it("stamps loc on pages/index.tsx then inserts data-nuvio-id", async () => {
    const projectRoot = "/proj";
    const file = join(projectRoot, "pages/index.tsx");
    const source = `export default function Home() {
  return <p>Subtitle</p>;
}
`;
    const { code: stamped, changed } = injectJsxLocAttributes(
      source,
      file,
      projectRoot,
    );
    expect(changed).toBe(true);
    const locMatch = stamped.match(/data-nuvio-loc="([^"]+)"/);
    expect(locMatch).toBeTruthy();
    const loc = parseNuvioLocValue(locMatch![1]!);
    expect(loc).not.toBeNull();
    expect(loc!.file).toBe("pages/index.tsx");

    const tagged = await insertDataNuvioIdAtLocation(
      stamped,
      file,
      loc!.line,
      loc!.column,
      "page.subtitle",
    );
    expect(tagged.ok).toBe(true);
    if (tagged.ok) {
      expect(tagged.source).toContain('data-nuvio-id="page.subtitle"');
      expect(tagged.source).toContain("data-nuvio-loc=");
    }
  });

  it("stamps loc on app/page.tsx App Router paths", () => {
    const projectRoot = "/proj";
    const file = join(projectRoot, "src/app/page.tsx");
    const source = `export default function Page() {
  return <span>Label</span>;
}
`;
    const { code: stamped, changed } = injectJsxLocAttributes(
      source,
      file,
      projectRoot,
    );
    expect(changed).toBe(true);
    expect(stamped).toContain('data-nuvio-loc="src/app/page.tsx:');
  });
});
