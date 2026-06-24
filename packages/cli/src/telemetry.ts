import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import os from "node:os";
import { PostHog } from "posthog-node";
import type { AppContext, FrameworkKind, RouterKind } from "./app-context.js";
import type { PackageManager } from "./detect-pm.js";
import type { ProjectContext } from "./detect-project.js";
import { MSG } from "./messages.js";
import { NUVIO_POSTHOG_TOKEN as DEFAULT_POSTHOG_TOKEN } from "./nuvio-posthog-token.js";
import { NUVIO_VERSION } from "./version.js";

const POSTHOG_HOST = "https://us.i.posthog.com";

function telemetryFilePath(): string {
  return join(homedir(), ".nuvio", "telemetry.json");
}

export type CliTelemetryProps = {
  nuvio_version: string;
  os: NodeJS.Platform;
  arch: string;
  node: string;
  package_manager?: PackageManager;
  framework?: FrameworkKind | "unknown";
  router?: RouterKind;
  has_react?: boolean;
  has_vite?: boolean;
  has_next?: boolean;
  has_tailwind?: boolean;
  error_code?: string;
  result_tier?: "full" | "partial" | "failed";
};

export type CliInvokedCommand =
  | "init"
  | "doctor"
  | "scan"
  | "stats"
  | "help"
  | "unknown"
  | "none";

export type CliTelemetryEvent =
  | "nuvio_cli_invoked"
  | "nuvio_init_started"
  | "nuvio_init_completed"
  | "nuvio_init_failed"
  | "doctor_run"
  | "scan_run"
  | "stats_run";

export type DoctorRunTelemetry = CliTelemetryProps & {
  pass_count: number;
  warn_count: number;
  fail_count: number;
  ready: boolean;
};

export type ScanRunTelemetry = CliTelemetryProps & {
  host_count: number;
  duplicate_count: number;
  library_count: number;
};

export type StatsRunTelemetry = CliTelemetryProps & {
  editable_hosts: number;
  tagged_files: number;
  duplicate_ids: number;
  table_hosts: number;
  library_count: number;
};

export type CliInvokedProps = {
  nuvio_version: string;
  os: NodeJS.Platform;
  arch: string;
  node: string;
  command: CliInvokedCommand;
  package_manager?: PackageManager;
};

const FORBIDDEN_PROP_KEYS = new Set([
  "cwd",
  "root",
  "file",
  "path",
  "name",
  "message",
  "stack",
]);

const SHUTDOWN_TIMEOUT_MS = 3_000;

let client: PostHog | null = null;
let sessionAnonymousId: string | null = null;
let shutdownDone = false;
let signalHandlersRegistered = false;

function telemetryDebug(message: string, detail?: unknown): void {
  if (process.env.NUVIO_TELEMETRY_DEBUG !== "1") return;
  if (detail !== undefined) {
    console.error(`[nuvio telemetry] ${message}`, detail);
    return;
  }
  console.error(`[nuvio telemetry] ${message}`);
}

export function isTelemetryEnabled(): boolean {
  const flag = process.env.NUVIO_TELEMETRY;
  if (flag === "0") return false;
  if (flag?.toLowerCase() === "false") return false;
  return true;
}

function posthogToken(): string {
  return process.env.NUVIO_POSTHOG_TOKEN ?? DEFAULT_POSTHOG_TOKEN;
}

function tokenIsConfigured(token: string): boolean {
  return Boolean(token && token.startsWith("phc_"));
}

function readOrCreateAnonymousId(): string {
  if (sessionAnonymousId) return sessionAnonymousId;
  try {
    const raw = readFileSync(telemetryFilePath(), "utf8");
    const parsed = JSON.parse(raw) as { anonymousId?: string };
    if (parsed.anonymousId) {
      sessionAnonymousId = parsed.anonymousId;
      return parsed.anonymousId;
    }
  } catch {
    // fall through to create
  }
  const id = randomUUID();
  sessionAnonymousId = id;
  try {
    mkdirSync(join(homedir(), ".nuvio"), { recursive: true, mode: 0o700 });
    writeFileSync(
      telemetryFilePath(),
      JSON.stringify({ anonymousId: id }, null, 2),
      { mode: 0o600 },
    );
  } catch {
    // ephemeral session id only
  }
  return id;
}

function getClient(): PostHog | null {
  if (!isTelemetryEnabled()) return null;
  const token = posthogToken();
  if (!tokenIsConfigured(token)) return null;
  if (!client) {
    client = new PostHog(token, {
      host: POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
    telemetryDebug("PostHog client initialized", {
      host: POSTHOG_HOST,
      tokenPrefix: `${token.slice(0, 8)}…`,
    });
  }
  return client;
}

function sanitizeProps(
  props?: CliTelemetryProps,
): Record<string, string | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_PROP_KEYS.has(key)) continue;
    if (value === undefined) continue;
    if (typeof value === "string" && /[/\\]/.test(value)) continue;
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function resolveCliInvokedCommand(
  help: boolean,
  command: string | null,
): CliInvokedCommand {
  if (help) return "help";
  if (!command) return "none";
  if (command === "init") return "init";
  if (command === "doctor") return "doctor";
  if (command === "scan") return "scan";
  if (command === "stats") return "stats";
  return "unknown";
}

export function buildCliInvokedProps(
  command: CliInvokedCommand,
  pmOverride?: PackageManager,
): CliInvokedProps {
  const props: CliInvokedProps = {
    nuvio_version: NUVIO_VERSION,
    os: process.platform,
    arch: os.arch(),
    node: process.version,
    command,
  };
  if (pmOverride) props.package_manager = pmOverride;
  return props;
}

export function buildCliTelemetryProps(
  pm?: PackageManager,
  project?: ProjectContext,
): CliTelemetryProps {
  const props: CliTelemetryProps = {
    nuvio_version: NUVIO_VERSION,
    os: process.platform,
    arch: os.arch(),
    node: process.version,
  };
  if (pm) props.package_manager = pm;
  if (project) {
    props.has_react = true;
    props.has_vite = true;
    props.has_tailwind = project.tailwindOk;
    props.framework = "vite";
    props.router = "none";
  }
  return props;
}

export function buildAppTelemetryProps(
  pm: PackageManager,
  app: AppContext,
): CliTelemetryProps {
  const props: CliTelemetryProps = {
    nuvio_version: NUVIO_VERSION,
    os: process.platform,
    arch: os.arch(),
    node: process.version,
    package_manager: pm,
    framework: app.framework,
    router: app.router,
    has_react: true,
    has_vite: app.framework === "vite",
    has_next: app.framework.startsWith("next"),
    has_tailwind: app.tailwindOk,
  };
  return props;
}

export function preflightErrorCode(message: string): string {
  if (message === MSG.noPackageJson) return "preflight_no_package_json";
  if (message === MSG.noVite) return "preflight_no_vite";
  if (message === MSG.noReact) return "preflight_no_react";
  if (message === MSG.noViteDep) return "preflight_no_vite_dep";
  if (message === MSG.monorepoRoot || message === MSG.cliPackage) {
    return "preflight_monorepo";
  }
  return "preflight_unknown";
}

export function captureCliInvoked(
  command: CliInvokedCommand,
  pmOverride?: PackageManager,
): void {
  captureCliEvent("nuvio_cli_invoked", buildCliInvokedProps(command, pmOverride));
}

export function captureCliEvent(
  event: CliTelemetryEvent,
  props?:
    | CliTelemetryProps
    | CliInvokedProps
    | DoctorRunTelemetry
    | ScanRunTelemetry
    | StatsRunTelemetry,
): void {
  try {
    if (!isTelemetryEnabled()) {
      telemetryDebug(`skipped ${event} (telemetry disabled)`);
      return;
    }
    const ph = getClient();
    if (!ph) {
      telemetryDebug(`skipped ${event} (no PostHog client — check token)`);
      return;
    }
    const distinctId = readOrCreateAnonymousId();
    ph.capture({
      distinctId,
      event,
      properties: sanitizeProps(props),
    });
    telemetryDebug(`captured ${event}`, { distinctId });
  } catch (error) {
    telemetryDebug(`capture failed for ${event}`, error);
  }
}

async function flushAndShutdownClient(): Promise<void> {
  if (!client) return;
  const active = client;
  client = null;
  await Promise.race([
    (async () => {
      await active.flush();
      await active.shutdown();
    })(),
    new Promise<void>((_, reject) => {
      setTimeout(
        () => reject(new Error("telemetry shutdown timed out")),
        SHUTDOWN_TIMEOUT_MS,
      );
    }),
  ]);
}

export async function shutdownTelemetry(): Promise<void> {
  if (shutdownDone) return;
  shutdownDone = true;
  try {
    await flushAndShutdownClient();
    telemetryDebug("flush + shutdown complete");
  } catch (error) {
    telemetryDebug("shutdown failed", error);
  }
}

export function registerTelemetrySignalHandlers(): void {
  if (signalHandlersRegistered) return;
  signalHandlersRegistered = true;

  const onSignal = (signal: NodeJS.Signals) => {
    void (async () => {
      await shutdownTelemetry();
      const code = signal === "SIGINT" ? 130 : 143;
      process.exit(code);
    })();
  };

  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
}

/** Test-only reset of module state. */
export function __resetTelemetryForTests(): void {
  client = null;
  sessionAnonymousId = null;
  shutdownDone = false;
  signalHandlersRegistered = false;
}
