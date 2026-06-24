import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { patchNextConfigFile } from "../src/patch-next-config.js";
import { patchNextLayoutFile, resolveNextLayoutFile } from "../src/patch-next-layout.js";
import { ensureNextServerJs, patchPackageJsonDevScript } from "../src/patch-next-server.js";
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

describe("patch next config", () => {
  it("wraps default export with withNuvio()", () => {
    const root = fixture("next-app-router-minimal");
    const configPath = join(root, "next.config.ts");
    const result = patchNextConfigFile(configPath);
    expect(result.ok).toBe(true);
    const text = readFileSync(configPath, "utf8");
    expect(text).toContain("@nuvio/next");
    expect(text).toContain("withNuvio");
  });
});

describe("patch next layout", () => {
  it("mounts NuvioNextShell in body", () => {
    const root = fixture("next-app-router-minimal");
    const layout = resolveNextLayoutFile(root)!;
    const result = patchNextLayoutFile(layout);
    expect(result.ok).toBe(true);
    const text = readFileSync(layout, "utf8");
    expect(text).toContain("NuvioNextShell");
    expect(text).toContain("@nuvio/overlay/next");
    expect(text).toContain("@nuvio/overlay/style.css");
  });
});

describe("patch next server", () => {
  it("creates server.js and updates dev script", () => {
    const root = fixture("next-app-router-minimal");
    const server = ensureNextServerJs(root);
    expect(server.outcome.ok).toBe(true);
    expect(readFileSync(join(root, "server.js"), "utf8")).toContain(
      "createNuvioNextDevServer",
    );
    const pkgResult = patchPackageJsonDevScript(root);
    expect(pkgResult.ok).toBe(true);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts: { dev: string };
    };
    expect(pkg.scripts.dev).toBe("node server.js");
  });
});

describe("runInit next", () => {
  it("dry run makes no file changes", async () => {
    const root = fixture("next-app-router-minimal");
    const configBefore = readFileSync(join(root, "next.config.ts"), "utf8");
    const code = await runInit({
      cwd: root,
      yes: true,
      dryRun: true,
      noInstall: true,
    });
    expect(code).toBe(0);
    expect(readFileSync(join(root, "next.config.ts"), "utf8")).toBe(configBefore);
    expect(existsSync(join(root, "nuvio"))).toBe(false);
  });

  it("wires minimal Next fixture with --no-install", async () => {
    const root = fixture("next-app-router-minimal");
    const code = await runInit({
      cwd: root,
      yes: true,
      noInstall: true,
    });
    expect(code).toBe(0);
    expect(readFileSync(join(root, "next.config.ts"), "utf8")).toContain("withNuvio");
    expect(readFileSync(join(root, "src/app/layout.tsx"), "utf8")).toContain(
      "NuvioNextShell",
    );
    expect(projectHasPageTitleId(root)).toBe(true);
    expect(existsSync(join(root, "server.js"))).toBe(true);
    expect(existsSync(join(root, "nuvio/START_HERE.md"))).toBe(true);

    const verification = verifyNextProject(
      root,
      join(root, "package.json"),
      "app",
    );
    expect(verification.deps).toBe("OK");
    expect(verification.config).toBe("OK");
    expect(verification.server).toBe("OK");
    expect(verification.shell).toBe("OK");
    expect(verification.starterId).toBe("OK");
  });
});
