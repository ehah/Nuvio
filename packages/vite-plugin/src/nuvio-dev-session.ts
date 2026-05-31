import type { IncomingMessage, Server as HttpServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import type { Duplex } from "node:stream";
import { watch } from "node:fs";
import { WebSocket, WebSocketServer } from "ws";
import { applyPatchToSource } from "@nuvio/ast-engine";
import {
  NUVIO_WS_PATH,
  PROTOCOL_VERSION,
  type IndexWireEntry,
  type RuntimeDiagnostics,
  parseClientMessage,
  serializeServerMessage,
} from "@nuvio/shared";
import { assertPathWithinRoot } from "@nuvio/shared/secure-path";
import { readRuntimeVersions } from "./read-dep-version.js";
import { pathnameFromUpgradeUrl } from "./upgrade-url.js";
import {
  buildSourceIndex,
  extractIdsFromSource,
  pickBestSourceIndex,
  type BuildSourceIndexResult,
} from "./source-index.js";

const APP_ENTRY_CANDIDATES = ["src/App.tsx", "src/app.tsx", "App.tsx"] as const;

const DEFAULT_GLOBS = [
  "src/**/*.{tsx,jsx}",
  "apps/**/src/**/*.{tsx,jsx}",
  "packages/**/src/**/*.{tsx,jsx}",
];

export type NuvioDevSessionOptions = {
  enabled?: boolean;
  root: string;
  configDir?: string;
  scanGlobs?: string[];
  verbose?: boolean;
  classNameMode?: "literal-only" | "cn-basic";
  log?: Pick<Console, "info" | "warn">;
};

export type NuvioDevSessionHandle = {
  rebuildIndex: () => void;
  close: () => void;
};

function nuvioWsMessageToText(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }
  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }
  if (ArrayBuffer.isView(data)) {
    const v = data as ArrayBufferView;
    return Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString("utf8");
  }
  return String(data);
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (origin === undefined || origin === "") {
    return true;
  }
  try {
    const u = new URL(origin);
    return (
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
      (u.protocol === "http:" || u.protocol === "https:")
    );
  } catch {
    return false;
  }
}

function supplementIndexFromAppTsx(
  serverRoot: string,
  built: BuildSourceIndexResult,
  classNameMode: "literal-only" | "cn-basic",
  emitWarn: (msg: string) => void,
): BuildSourceIndexResult {
  if (built.entries.length > 0) {
    return built;
  }
  for (const rel of APP_ENTRY_CANDIDATES) {
    const appTsx = path.resolve(serverRoot, rel);
    if (!fs.existsSync(appTsx)) {
      continue;
    }
    try {
      const code = fs.readFileSync(appTsx, "utf8");
      const hits = extractIdsFromSource(appTsx, code, { classNameMode });
      if (hits.length === 0) {
        continue;
      }
      emitWarn(
        `[Nuvio] Source index had 0 ids; supplemented from ${appTsx} (${hits.length} id(s)).`,
      );
      return {
        ...built,
        entries: hits,
        scannedFileCount: Math.max(built.scannedFileCount, 1),
      };
    } catch {
      /* try next */
    }
  }
  return built;
}

/** Attach Nuvio dev WebSocket + source index to any Node HTTP server (Vite or Next custom server). */
export function attachNuvioDevSession(
  httpServer: HttpServer,
  options: NuvioDevSessionOptions,
): NuvioDevSessionHandle {
  const log = options.log ?? console;
  const enabled = options.enabled ?? process.env.NUVIO !== "0";
  const scanGlobs = options.scanGlobs ?? DEFAULT_GLOBS;
  const verbose = options.verbose ?? false;
  const classNameMode = options.classNameMode ?? "literal-only";
  const serverRoot = path.resolve(options.root);
  const fromConfigFile = options.configDir ?? "";
  const rootCandidates = [path.resolve(fromConfigFile || serverRoot), serverRoot, process.cwd()];
  const rootsLabel = [...new Set(rootCandidates)].join(" | ");

  let indexVersion = 0;
  let cachedIndexPayload: string | null = null;
  let runtimeDiagnostics: RuntimeDiagnostics = { overlayCssMode: "self-contained" };
  const idToEntry = new Map<string, IndexWireEntry>();
  const wss = new WebSocketServer({ noServer: true });

  type UndoSnapshot = { file: string; contents: string };
  const undoStack: UndoSnapshot[] = [];
  const UNDO_MAX = 32;
  const pushUndoSnapshot = (file: string, contents: string): void => {
    undoStack.push({ file, contents });
    while (undoStack.length > UNDO_MAX) {
      undoStack.shift();
    }
  };

  const rebuildIndex = (): void => {
    if (!enabled) {
      return;
    }
    let built = pickBestSourceIndex(rootCandidates, scanGlobs, { classNameMode });
    built = supplementIndexFromAppTsx(serverRoot, built, classNameMode, log.warn);
    if (built.entries.length === 0) {
      const fallback = buildSourceIndex(serverRoot, ["src/**/*.{tsx,jsx}"], { classNameMode });
      if (fallback.entries.length > 0) {
        log.warn(
          `[Nuvio] Multi-root scan yielded 0 ids; using serverRoot-only index (${fallback.entries.length} id(s)).`,
        );
        built = fallback;
      }
    }
    indexVersion += 1;
    idToEntry.clear();
    for (const e of built.entries) {
      idToEntry.set(e.id, e);
    }

    runtimeDiagnostics = {
      ...readRuntimeVersions(serverRoot),
      overlayCssMode: "self-contained",
    };

    cachedIndexPayload = serializeServerMessage({
      type: "indexReady",
      protocolVersion: PROTOCOL_VERSION,
      indexVersion,
      entries: built.entries,
      duplicateErrors: built.duplicateErrors,
      diagnostics: runtimeDiagnostics,
    });

    if (verbose) {
      log.info(
        `[Nuvio] index roots=${rootsLabel} matchedFiles=${built.scannedFileCount} uniqueIds=${built.entries.length}`,
      );
    } else {
      log.info(`[Nuvio] index — ${built.entries.length} id(s), ${built.scannedFileCount} file(s)`);
    }

    if (cachedIndexPayload && wss.clients.size > 0) {
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(cachedIndexPayload);
        }
      }
    }
  };

  const debouncedRebuild = (() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    return () => {
      if (t) {
        clearTimeout(t);
      }
      t = setTimeout(() => {
        rebuildIndex();
        t = undefined;
      }, 120);
    };
  })();

  const srcDir = path.join(serverRoot, "src");
  let fileWatcher: ReturnType<typeof watch> | null = null;
  if (enabled && fs.existsSync(srcDir)) {
    try {
      fileWatcher = watch(srcDir, { recursive: true }, (_event, filename) => {
        if (filename && /\.(tsx|jsx)$/.test(filename)) {
          debouncedRebuild();
        }
      });
    } catch {
      /* fs.watch recursive may fail on some platforms */
    }
  }

  wss.on("connection", (ws) => {
    if (cachedIndexPayload && ws.readyState === WebSocket.OPEN) {
      ws.send(cachedIndexPayload);
    }

    ws.on("message", async (data) => {
      const text = nuvioWsMessageToText(data);
      const msg = parseClientMessage(text);
      if (!msg) {
        ws.send(
          serializeServerMessage({
            type: "error",
            code: "bad_message",
            message: "Invalid client message",
          }),
        );
        return;
      }
      if (msg.protocolVersion !== PROTOCOL_VERSION) {
        ws.send(
          serializeServerMessage({
            type: "error",
            code: "bad_version",
            message: `Expected protocolVersion ${PROTOCOL_VERSION}`,
            requestId: "requestId" in msg ? msg.requestId : undefined,
          }),
        );
        return;
      }

      if (msg.type === "ping") {
        ws.send(
          serializeServerMessage({
            type: "pong",
            protocolVersion: PROTOCOL_VERSION,
            requestId: msg.requestId,
            diagnostics: runtimeDiagnostics,
          }),
        );
        if (cachedIndexPayload) {
          ws.send(cachedIndexPayload);
        }
        return;
      }

      if (msg.type === "select") {
        const entry = idToEntry.get(msg.id);
        if (!entry) {
          ws.send(
            serializeServerMessage({
              type: "selectAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              id: msg.id,
              ok: false,
              errorCode: "unknown_id",
              errorMessage: "Id not found in dev source index",
            }),
          );
          return;
        }
        ws.send(
          serializeServerMessage({
            type: "selectAck",
            protocolVersion: PROTOCOL_VERSION,
            requestId: msg.requestId,
            id: msg.id,
            ok: true,
            file: entry.file,
            line: entry.line,
            column: entry.column,
            patchHostId: entry.patchHostId,
            primaryTextTargetKey: entry.primaryTextTargetKey,
            textTargets: entry.textTargets,
            styleTargets: entry.styleTargets,
            hierarchyRole: entry.hierarchyRole,
            parentHostId: entry.parentHostId,
            childTargetIds: entry.childTargetIds,
            rowTargets: entry.rowTargets,
            tableMeta: entry.tableMeta,
            tableDataField: entry.tableDataField,
          }),
        );
        return;
      }

      if (msg.type === "patchUndo") {
        const writeGuardRoot = path.resolve(fromConfigFile || serverRoot);
        const last = undoStack.pop();
        if (!last) {
          ws.send(
            serializeServerMessage({
              type: "patchUndoAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              ok: false,
              errorCode: "empty_stack",
              errorMessage: "Nothing to undo",
            }),
          );
          return;
        }
        try {
          assertPathWithinRoot(writeGuardRoot, last.file);
          fs.writeFileSync(last.file, last.contents, "utf8");
        } catch (e) {
          undoStack.push(last);
          ws.send(
            serializeServerMessage({
              type: "patchUndoAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              ok: false,
              errorCode: "undo_write_error",
              errorMessage: String(e),
            }),
          );
          return;
        }
        ws.send(
          serializeServerMessage({
            type: "patchUndoAck",
            protocolVersion: PROTOCOL_VERSION,
            requestId: msg.requestId,
            ok: true,
            file: last.file,
            undoStackDepth: undoStack.length,
          }),
        );
        return;
      }

      if (msg.type === "patchApply") {
        const entry = idToEntry.get(msg.id);
        const writeGuardRoot = path.resolve(fromConfigFile || serverRoot);
        const dryRun = msg.dryRun === true;
        const patchAckExtras = dryRun ? ({ dryRun: true as const } as const) : {};
        if (!entry) {
          ws.send(
            serializeServerMessage({
              type: "patchAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              id: msg.id,
              ok: false,
              errorCode: "unknown_id",
              errorMessage: "Id not found in dev source index",
              ...patchAckExtras,
            }),
          );
          return;
        }
        try {
          assertPathWithinRoot(writeGuardRoot, entry.file);
        } catch (e) {
          ws.send(
            serializeServerMessage({
              type: "patchAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              id: msg.id,
              ok: false,
              errorCode: "path_escape",
              errorMessage: String(e),
              ...patchAckExtras,
            }),
          );
          return;
        }
        let source: string;
        try {
          source = fs.readFileSync(entry.file, "utf8");
        } catch (e) {
          ws.send(
            serializeServerMessage({
              type: "patchAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              id: msg.id,
              ok: false,
              errorCode: "read_error",
              errorMessage: String(e),
              ...patchAckExtras,
            }),
          );
          return;
        }
        const result = await applyPatchToSource(source, entry.file, msg.id, msg.ops, {
          classNameMode,
          activeBreakpoint: msg.activeBreakpoint,
        });
        if (!result.ok) {
          ws.send(
            serializeServerMessage({
              type: "patchAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              id: msg.id,
              ok: false,
              errorCode: result.code,
              errorMessage: result.message,
              ...patchAckExtras,
            }),
          );
          return;
        }
        if (dryRun) {
          ws.send(
            serializeServerMessage({
              type: "patchAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              id: msg.id,
              ok: true,
              diffSummary: result.diffSummary,
              dryRun: true,
            }),
          );
          return;
        }
        try {
          fs.writeFileSync(entry.file, result.source, "utf8");
        } catch (e) {
          ws.send(
            serializeServerMessage({
              type: "patchAck",
              protocolVersion: PROTOCOL_VERSION,
              requestId: msg.requestId,
              id: msg.id,
              ok: false,
              errorCode: "write_error",
              errorMessage: String(e),
            }),
          );
          return;
        }
        pushUndoSnapshot(entry.file, source);
        ws.send(
          serializeServerMessage({
            type: "patchAck",
            protocolVersion: PROTOCOL_VERSION,
            requestId: msg.requestId,
            id: msg.id,
            ok: true,
            diffSummary: result.diffSummary,
            writtenFile: entry.file,
            undoStackDepth: undoStack.length,
          }),
        );
      }
    });
  });

  const onUpgrade = (request: IncomingMessage, socket: Duplex, head: Buffer): void => {
    if (!enabled) {
      return;
    }
    const pathname = pathnameFromUpgradeUrl(request.url);
    if (pathname !== NUVIO_WS_PATH) {
      return;
    }
    if (!isAllowedOrigin(request.headers.origin)) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  };

  httpServer.on("upgrade", onUpgrade);

  if (enabled) {
    log.info("[Nuvio] dev session attached (App Router / custom server mode)");
    rebuildIndex();
  } else {
    log.info("[Nuvio] disabled (set NUVIO=1 to enable)");
  }

  return {
    rebuildIndex,
    close: () => {
      httpServer.off("upgrade", onUpgrade);
      fileWatcher?.close();
      for (const client of wss.clients) {
        client.close();
      }
      wss.close();
    },
  };
}

export { DEFAULT_GLOBS as NUVIO_DEFAULT_SCAN_GLOBS };
