import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { runInit } from "../src/init.js";
import { runScan } from "../src/scan-cmd.js";
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

describe("runScan", () => {
  it("finds no hosts before init", () => {
    const root = fixture("vite-react-ts-minimal");
    const code = runScan({ cwd: root });
    expect(code).toBe(0);
  });

  it("finds page.title after init", async () => {
    const root = fixture("vite-react-ts-minimal");
    await runInit({ cwd: root, yes: true, noInstall: true });
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    try {
      const code = runScan({ cwd: root, json: true });
      expect(code).toBe(0);
    } finally {
      console.log = orig;
    }
    const parsed = JSON.parse(logs.join("\n")) as {
      hostCount: number;
      hosts: Array<{ id: string }>;
    };
    expect(parsed.hostCount).toBe(1);
    expect(parsed.hosts[0]?.id).toBe("page.title");
  });

  it("lists existing host in vite-already-nuvio fixture", () => {
    const root = fixture("vite-already-nuvio");
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    try {
      runScan({ cwd: root, json: true });
    } finally {
      console.log = orig;
    }
    const parsed = JSON.parse(logs.join("\n")) as {
      hosts: Array<{ id: string }>;
    };
    expect(parsed.hosts.some((h) => h.id === "page.title")).toBe(true);
  });

  it("scans next-dogfood from monorepo root with --app", () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    try {
      const code = runScan({
        cwd: repoRoot,
        app: "next-dogfood",
        json: true,
      });
      expect(code).toBe(0);
    } finally {
      console.log = orig;
    }
    const parsed = JSON.parse(logs.join("\n")) as {
      hostCount: number;
      framework: string;
      hosts: Array<{ id: string }>;
    };
    expect(parsed.framework).toMatch(/^next-/);
    expect(parsed.hosts.some((h) => h.id === "dashboard.title")).toBe(true);
  });
});
