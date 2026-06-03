import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

export function copyFixture(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `nuvio-cli-${name}-`));
  cpSync(join(FIXTURES, name), dir, { recursive: true });
  return dir;
}

export function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
