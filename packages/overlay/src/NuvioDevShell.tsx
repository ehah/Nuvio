import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactElement,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type {
  Breakpoint,
  DuplicateIdError,
  IndexWireEntry,
  PatchOp,
  RuntimeDiagnostics,
} from "@nuvio/shared";
import {
  NUVIO_WS_PATH,
  PROTOCOL_VERSION,
  parseServerMessage,
} from "@nuvio/shared";
import { InteractionLayer } from "./InteractionLayer.js";
import {
  cornerAnchorPosition,
  clampToViewport,
  DEFAULT_OVERLAY_CHROME,
  loadOverlayChromePersist,
  OVERLAY_CHROME_MARGIN,
  saveOverlayChromePersist,
  snapToNearestCorner,
  type ChipCorner,
  type OverlayChromePersist,
  type Point,
} from "./overlay-chrome-storage.js";
import {
  NUVO_GLASS_CONTENT,
  NUVO_GLASS_SHELL,
  NUVO_GLASS_SHELL_INLINE,
  NUVO_ROOT,
} from "./overlay-chrome-classes.js";
import { clearNuvioOutlines } from "./nuvio-outlines.js";
import { pickDefaultTextTargetKey } from "./text-target-dom.js";
import { useNuvioShadowMount } from "./NuvioShadowRoot.js";
import { PropertyPanelShell } from "./PropertyPanelShell.js";
import { NuvioChipStatus, type NuvioChannelState } from "./RuntimeDiagnosticsBlock.js";
import { isStructuralOnlyOps } from "./structural-patch-ops.js";
import { useChromeDrag } from "./useChromeDrag.js";
import {
  loadDeveloperDetails,
  saveDeveloperDetails,
} from "./developer-details-storage.js";

type ChannelState = "idle" | "connecting" | "ready" | "error";

type PendingPatch = { kind: "preview" | "apply"; opsFingerprint: string; ops: PatchOp[] };
type DevicePreset = "desktop" | "tablet" | "mobile";

function shortDisplayPath(absPath: string): string {
  const norm = absPath.replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/");
  if (idx === -1) {
    return absPath;
  }
  const parent = norm.slice(0, idx).split("/").pop() ?? "";
  const base = norm.slice(idx + 1);
  return parent ? `${parent}/${base}` : base;
}

/** Avoid closing a CONNECTING socket (Strict Mode double-mount); browsers log noisy errors. */
function safeCloseWebSocket(socket: WebSocket): void {
  if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
    return;
  }
  if (socket.readyState === WebSocket.CONNECTING) {
    socket.addEventListener(
      "open",
      () => {
        socket.close(1000, "nuvio-dispose");
      },
      { once: true },
    );
    return;
  }
  socket.close(1000, "nuvio-dispose");
}

/** Normalize browser WebSocket payloads (Safari may use ArrayBuffer; Vite HMR can use Blob). */
function wsPayloadToString(data: unknown): string | null {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new TextDecoder("utf-8").decode(data);
  }
  if (ArrayBuffer.isView(data)) {
    const v = data as ArrayBufferView;
    return new TextDecoder("utf-8").decode(
      new Uint8Array(v.buffer, v.byteOffset, v.byteLength),
    );
  }
  if (data instanceof Blob) {
    return null;
  }
  return null;
}

/**
 * Dev shell: edit mode, WebSocket channel, selection, Editor panel, Phase 3 patch validate/apply/undo.
 */
function assignRef<T extends HTMLElement>(
  ref: RefObject<T | null>,
  el: T | null,
): void {
  (ref as MutableRefObject<T | null>).current = el;
}

export function NuvioDevShellInner(): ReactElement {
  const shadowMount = useNuvioShadowMount();
  const panelRef = useRef<HTMLElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const shadowHostRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    shadowHostRef.current = shadowMount?.host ?? null;
  }, [shadowMount]);
  const chromeRootRefs = useMemo(
    () => [panelRef, chipRef, shadowHostRef] as const,
    [],
  );
  const wsRef = useRef<WebSocket | null>(null);
  const connectGenRef = useRef(0);

  const [chromeLayout, setChromeLayout] = useState<OverlayChromePersist>(loadOverlayChromePersist);
  const [chipPos, setChipPos] = useState<Point | null>(() =>
    cornerAnchorPosition(
      loadOverlayChromePersist().chip.corner,
      220,
      120,
      OVERLAY_CHROME_MARGIN,
    ),
  );

  const patchChrome = useCallback(
    (patch: { panel?: Partial<OverlayChromePersist["panel"]>; chip?: Partial<OverlayChromePersist["chip"]> }) => {
      setChromeLayout((prev) => {
        const next: OverlayChromePersist = {
          panel: patch.panel ? { ...prev.panel, ...patch.panel } : prev.panel,
          chip: patch.chip ? { ...prev.chip, ...patch.chip } : prev.chip,
        };
        saveOverlayChromePersist(next);
        return next;
      });
    },
    [],
  );

  const onPanelCollapsedChange = useCallback(
    (collapsed: boolean) => {
      patchChrome({ panel: { collapsed } });
    },
    [patchChrome],
  );

  const onPanelPositionChange = useCallback(
    (position: Point | null) => {
      patchChrome({ panel: { position } });
    },
    [patchChrome],
  );

  const onResetPanelPosition = useCallback(() => {
    patchChrome({ panel: { position: null, collapsed: false } });
  }, [patchChrome]);

  const onChipCollapsedChange = useCallback(
    (collapsed: boolean) => {
      patchChrome({ chip: { collapsed } });
    },
    [patchChrome],
  );

  const onChipCornerChange = useCallback(
    (corner: ChipCorner) => {
      patchChrome({ chip: { corner } });
    },
    [patchChrome],
  );

  const onResetChipPosition = useCallback(() => {
    const corner = DEFAULT_OVERLAY_CHROME.chip.corner;
    patchChrome({ chip: { corner, collapsed: false } });
    const el = chipRef.current;
    if (el) {
      setChipPos(cornerAnchorPosition(corner, el.offsetWidth, el.offsetHeight));
    }
  }, [patchChrome]);

  const anchorChipToCorner = useCallback(
    (corner: ChipCorner) => {
      const el = chipRef.current;
      if (!el) {
        return;
      }
      setChipPos(cornerAnchorPosition(corner, el.offsetWidth, el.offsetHeight));
    },
    [],
  );

  const commitChipDrag = useCallback(
    (pos: Point) => {
      const el = chipRef.current;
      if (!el) {
        return;
      }
      const centerX = pos.x + el.offsetWidth / 2;
      const centerY = pos.y + el.offsetHeight / 2;
      const corner = snapToNearestCorner(centerX, centerY);
      onChipCornerChange(corner);
      setChipPos(cornerAnchorPosition(corner, el.offsetWidth, el.offsetHeight));
    },
    [onChipCornerChange],
  );

  const { dragging: chipDragging, onHeaderPointerDown: onChipHeaderPointerDown } = useChromeDrag({
    shellRef: chipRef,
    enabled: true,
    position: chipPos,
    setPosition: (next) => {
      if (next) {
        setChipPos(next);
      }
    },
    onDragEnd: commitChipDrag,
  });

  useLayoutEffect(() => {
    if (chipDragging) {
      return;
    }
    anchorChipToCorner(chromeLayout.chip.corner);
  }, [
    anchorChipToCorner,
    chipDragging,
    chromeLayout.chip.collapsed,
    chromeLayout.chip.corner,
  ]);

  useEffect(() => {
    const onResize = () => {
      if (!chipDragging) {
        anchorChipToCorner(chromeLayout.chip.corner);
      }
      const panelEl = panelRef.current;
      const panelPos = chromeLayout.panel.position;
      if (panelEl && panelPos) {
        const clamped = clampToViewport(
          panelPos.x,
          panelPos.y,
          panelEl.offsetWidth,
          panelEl.offsetHeight,
        );
        if (clamped.x !== panelPos.x || clamped.y !== panelPos.y) {
          onPanelPositionChange(clamped);
        }
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [
    anchorChipToCorner,
    chipDragging,
    chromeLayout.chip.corner,
    chromeLayout.panel.position,
    onPanelPositionChange,
  ]);

  // Clamp saved floating panel positions so chrome never renders off-screen.
  useLayoutEffect(() => {
    const panelPos = chromeLayout.panel.position;
    if (!panelPos || !panelRef.current) {
      return;
    }
    const panelEl = panelRef.current;
    const clamped = clampToViewport(
      panelPos.x,
      panelPos.y,
      panelEl.offsetWidth,
      panelEl.offsetHeight,
      OVERLAY_CHROME_MARGIN,
    );
    if (clamped.x !== panelPos.x || clamped.y !== panelPos.y) {
      onPanelPositionChange(clamped);
    }
  }, [chromeLayout.panel.position, onPanelPositionChange]);

  // Clamp chip if dragged off-screen after viewport resize.
  useLayoutEffect(() => {
    if (!chipPos || !chipRef.current || chipDragging) {
      return;
    }
    const el = chipRef.current;
    const clamped = clampToViewport(chipPos.x, chipPos.y, el.offsetWidth, el.offsetHeight);
    if (clamped.x !== chipPos.x || clamped.y !== chipPos.y) {
      setChipPos(clamped);
    }
  }, [chipPos, chipDragging]);

  const [editMode, setEditMode] = useState(false);
  const [channel, setChannel] = useState<ChannelState>("idle");
  const [knownIds, setKnownIds] = useState<ReadonlySet<string>>(new Set());
  const [indexEntries, setIndexEntries] = useState<readonly IndexWireEntry[]>([]);
  const [duplicateErrors, setDuplicateErrors] = useState<DuplicateIdError[]>([]);
  const [runtimeDiagnostics, setRuntimeDiagnostics] = useState<RuntimeDiagnostics | null>(null);
  const [developerDetails, setDeveloperDetails] = useState(() => loadDeveloperDetails());

  const onDeveloperDetailsChange = useCallback((enabled: boolean) => {
    setDeveloperDetails(enabled);
    saveDeveloperDetails(enabled);
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [devicePreset, setDevicePreset] = useState<DevicePreset>("desktop");
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>("base");
  const [activeTextTargetKey, setActiveTextTargetKey] = useState<string | null>(null);
  const [hoverTextTargetKey, setHoverTextTargetKey] = useState<string | null>(null);
  const [resolvedFile, setResolvedFile] = useState<string | undefined>(undefined);
  const [resolvedLine, setResolvedLine] = useState<number | undefined>(undefined);
  const [selectError, setSelectError] = useState<string | null>(null);

  const [previewSummary, setPreviewSummary] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [lastPatchError, setLastPatchError] = useState<string | null>(null);
  const [stagedVersion, setStagedVersion] = useState(0);
  const [previewValidatedFingerprint, setPreviewValidatedFingerprint] = useState<string | null>(
    null,
  );
  const [previewValidatedOps, setPreviewValidatedOps] = useState<PatchOp[] | null>(null);
  const [undoStackDepth, setUndoStackDepth] = useState(0);
  const [previewBusy, setPreviewBusy] = useState(false);
  const patchPendingMapRef = useRef(new Map<string, PendingPatch>());
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoPendingRef = useRef<string | null>(null);
  const resolvedFileRef = useRef<string | undefined>(undefined);
  const selectedIdRef = useRef<string | null>(null);
  const lastIndexEntriesRef = useRef<readonly IndexWireEntry[]>([]);
  const lastStagedOpsFpRef = useRef<string | null>(null);
  const autoApplyStructuralRef = useRef(false);
  const [structuralPreviewActive, setStructuralPreviewActive] = useState(false);

  useEffect(() => {
    resolvedFileRef.current = resolvedFile;
  }, [resolvedFile]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const selectedEntry = useMemo(
    () => (selectedId ? indexEntries.find((e) => e.id === selectedId) : undefined),
    [indexEntries, selectedId],
  );

  useEffect(() => {
    if (!selectedId) {
      setActiveTextTargetKey(null);
      setHoverTextTargetKey(null);
      return;
    }
    setActiveTextTargetKey(pickDefaultTextTargetKey(selectedEntry));
    setHoverTextTargetKey(null);
  }, [selectedId, selectedEntry]);

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => {
      if (prev) {
        clearNuvioOutlines();
        setSelectedId(null);
      }
      return !prev;
    });
  }, []);

  const sendPatchMessage = useCallback(
    (ops: PatchOp[], dryRun: boolean, patchHostId: string, bp: Breakpoint) => {
    const ws = wsRef.current;
    const id = patchHostId.trim() || selectedIdRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !id) {
      if (dryRun) {
        setPreviewBusy(false);
        setPreviewError(
          !ws || ws.readyState !== WebSocket.OPEN
            ? "Dev channel is not connected — wait for “connected” in the chip, then try Validate again."
            : "Nothing is selected — click an element on the page first.",
        );
      } else {
        setLastPatchError(
          !ws || ws.readyState !== WebSocket.OPEN
            ? "Dev channel is not connected."
            : "Nothing is selected.",
        );
      }
      return;
    }
    const requestId = `patch-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
    const opsFingerprint = JSON.stringify(ops);
    patchPendingMapRef.current.set(requestId, {
      kind: dryRun ? "preview" : "apply",
      opsFingerprint,
      ops,
    });
    if (dryRun) {
      setPreviewBusy(true);
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      previewTimeoutRef.current = setTimeout(() => {
        previewTimeoutRef.current = null;
        if (!patchPendingMapRef.current.has(requestId)) {
          return;
        }
        patchPendingMapRef.current.delete(requestId);
        setPreviewBusy(false);
        setPreviewError("No validation response from the dev server (timed out). Check the terminal for [Nuvio] errors.");
      }, 15_000);
    }
    ws.send(
      JSON.stringify({
        type: "patchApply",
        protocolVersion: PROTOCOL_VERSION,
        requestId,
        id,
        ops,
        activeBreakpoint: bp,
        ...(dryRun ? { dryRun: true } : {}),
      }),
    );
    },
    [],
  );

  const onRequestPreview = useCallback(
    (ops: PatchOp[], patchHostId: string) => {
      setStructuralPreviewActive(false);
      autoApplyStructuralRef.current = false;
      setPreviewValidatedFingerprint(null);
      setPreviewValidatedOps(null);
      setPreviewSummary(null);
      setPreviewError(null);
      setLastPatchError(null);
      sendPatchMessage(ops, true, patchHostId, activeBreakpoint);
    },
    [activeBreakpoint, sendPatchMessage],
  );

  const onRequestStructuralPreview = useCallback(
    (ops: PatchOp[]) => {
      lastStagedOpsFpRef.current = null;
      setStructuralPreviewActive(true);
      autoApplyStructuralRef.current = isStructuralOnlyOps(ops);
      setPreviewValidatedFingerprint(null);
      setPreviewValidatedOps(null);
      setPreviewSummary(null);
      setPreviewError(null);
      setLastPatchError(null);
      sendPatchMessage(ops, true, selectedIdRef.current ?? "", activeBreakpoint);
    },
    [activeBreakpoint, sendPatchMessage],
  );

  const onRequestApply = useCallback(
    (ops: PatchOp[], patchHostId: string) => {
      const fp = JSON.stringify(ops);
      if (fp !== previewValidatedFingerprint) {
        setLastPatchError(
          "Run Validate first — staged edits changed since the last successful validation.",
        );
        return;
      }
      setLastPatchError(null);
      sendPatchMessage(ops, false, patchHostId, activeBreakpoint);
    },
    [activeBreakpoint, previewValidatedFingerprint, sendPatchMessage],
  );

  const onRequestUndo = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    const requestId = `undo-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
    undoPendingRef.current = requestId;
    ws.send(
      JSON.stringify({
        type: "patchUndo",
        protocolVersion: PROTOCOL_VERSION,
        requestId,
      }),
    );
  }, []);

  const onCancelPreview = useCallback(() => {
    patchPendingMapRef.current.clear();
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    setPreviewBusy(false);
    setPreviewSummary(null);
    setPreviewError(null);
    setLastPatchError(null);
    setPreviewValidatedFingerprint(null);
    setPreviewValidatedOps(null);
  }, []);

  const onStagedPatchFingerprint = useCallback((fp: string) => {
    if (lastStagedOpsFpRef.current === fp) {
      return;
    }
    lastStagedOpsFpRef.current = fp;
    patchPendingMapRef.current.clear();
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    setPreviewBusy(false);
    setPreviewSummary(null);
    setPreviewError(null);
    setPreviewValidatedFingerprint(null);
    setPreviewValidatedOps(null);
  }, []);

  const sendSelect = useCallback((id: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    ws.send(
      JSON.stringify({
        type: "select",
        protocolVersion: PROTOCOL_VERSION,
        requestId: `select-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        id,
      }),
    );
  }, []);

  const onSelectId = useCallback(
    (id: string | null) => {
      if (!id) {
        return;
      }
      lastStagedOpsFpRef.current = null;
      patchPendingMapRef.current.clear();
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      setPreviewBusy(false);
      setPreviewSummary(null);
      setPreviewError(null);
      setPreviewValidatedFingerprint(null);
      setPreviewValidatedOps(null);
      setLastPatchError(null);
      setSelectedId(id);
      setSelectError(null);
      const hit = lastIndexEntriesRef.current.find((e) => e.id === id);
      if (hit) {
        setResolvedFile(shortDisplayPath(hit.file));
        setResolvedLine(hit.line);
      } else {
        setResolvedFile(undefined);
        setResolvedLine(undefined);
      }
      sendSelect(id);
    },
    [sendSelect],
  );

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;
    let retryMs = 400;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (cancelled) {
        return;
      }
      const myGen = ++connectGenRef.current;
      setChannel("connecting");
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${location.host}${NUVIO_WS_PATH}`);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        if (cancelled || connectGenRef.current !== myGen) {
          safeCloseWebSocket(ws!);
          return;
        }
        retryMs = 400;
        setChannel("ready");
        patchPendingMapRef.current.clear();
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        setPreviewBusy(false);
        undoPendingRef.current = null;
        setUndoStackDepth(0);
        ws?.send(
          JSON.stringify({
            type: "ping",
            protocolVersion: PROTOCOL_VERSION,
            requestId: "overlay-mount",
          }),
        );
        const sid = selectedIdRef.current;
        if (sid) {
          ws?.send(
            JSON.stringify({
              type: "select",
              protocolVersion: PROTOCOL_VERSION,
              requestId: `select-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
              id: sid,
            }),
          );
        }
      });

      ws.addEventListener("message", (ev) => {
        const raw = wsPayloadToString(ev.data);
        const parsePayload = (text: string): void => {
          const msg = parseServerMessage(text);
          if (!msg) {
            return;
          }
          // Index + select ack: apply regardless of socket generation (React Strict Mode drops the
          // first socket while selectAck may still be in flight).
          if (msg.type === "indexReady") {
            lastIndexEntriesRef.current = msg.entries;
            setIndexEntries(msg.entries);
            setKnownIds(new Set(msg.entries.map((e) => e.id)));
            setDuplicateErrors(msg.duplicateErrors);
            if (msg.diagnostics) {
              setRuntimeDiagnostics(msg.diagnostics);
            }
            const sid = selectedIdRef.current;
            if (sid) {
              const hit = msg.entries.find((e) => e.id === sid);
              if (hit) {
                setResolvedFile(shortDisplayPath(hit.file));
                setResolvedLine(hit.line);
                setSelectError(null);
              }
            }
            if (sid && msg.entries.some((e) => e.id === sid)) {
              queueMicrotask(() => {
                sendSelect(sid);
              });
            }
            return;
          }
          if (msg.type === "pong" && msg.diagnostics) {
            setRuntimeDiagnostics(msg.diagnostics);
            return;
          }
          if (msg.type === "selectAck") {
            if (msg.ok && msg.file != null && msg.line != null) {
              setResolvedFile(shortDisplayPath(msg.file));
              setResolvedLine(msg.line);
              setSelectError(null);
            } else {
              const hit = lastIndexEntriesRef.current.find((e) => e.id === msg.id);
              if (hit) {
                setResolvedFile(shortDisplayPath(hit.file));
                setResolvedLine(hit.line);
                setSelectError(null);
              } else {
                setResolvedFile(undefined);
                setResolvedLine(undefined);
                setSelectError(msg.errorMessage ?? msg.errorCode ?? "Selection failed");
              }
            }
            return;
          }
          if (msg.type === "patchAck") {
            const pending = patchPendingMapRef.current.get(msg.requestId);
            if (!pending) {
              return;
            }
            patchPendingMapRef.current.delete(msg.requestId);
            const savedFp = pending.opsFingerprint;
            if (pending.kind === "preview") {
              if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
                previewTimeoutRef.current = null;
              }
              setPreviewBusy(false);
              if (msg.ok) {
                const summary =
                  msg.diffSummary?.trim() ||
                  "Validation OK — server did not return a change summary line.";
                setPreviewSummary(summary);
                setPreviewError(null);
                setPreviewValidatedFingerprint(savedFp);
                setPreviewValidatedOps(pending.ops);
                if (autoApplyStructuralRef.current && isStructuralOnlyOps(pending.ops)) {
                  autoApplyStructuralRef.current = false;
                  sendPatchMessage(
                    pending.ops,
                    false,
                    selectedIdRef.current ?? "",
                    activeBreakpoint,
                  );
                }
              } else {
                autoApplyStructuralRef.current = false;
                setPreviewSummary(null);
                setPreviewValidatedFingerprint(null);
                setPreviewValidatedOps(null);
                setPreviewError(msg.errorMessage ?? msg.errorCode ?? "Validation failed");
              }
              return;
            }
            if (pending.kind === "apply") {
              if (msg.ok) {
                setStructuralPreviewActive(false);
                setLastPatchError(null);
                setPreviewSummary(null);
                setPreviewError(null);
                setPreviewValidatedFingerprint(null);
                setPreviewValidatedOps(null);
                setStagedVersion((v) => v + 1);
                if (msg.undoStackDepth !== undefined) {
                  setUndoStackDepth(msg.undoStackDepth);
                }
              } else {
                setLastPatchError(msg.errorMessage ?? msg.errorCode ?? "Apply failed");
              }
              return;
            }
          }
          if (msg.type === "patchUndoAck") {
            const rid = undoPendingRef.current;
            if (!rid || rid !== msg.requestId) {
              return;
            }
            undoPendingRef.current = null;
            if (msg.ok) {
              if (msg.undoStackDepth !== undefined) {
                setUndoStackDepth(msg.undoStackDepth);
              }
              setStagedVersion((v) => v + 1);
              setLastPatchError(null);
            } else {
              setLastPatchError(msg.errorMessage ?? msg.errorCode ?? "Undo failed");
            }
            return;
          }
          if (cancelled || connectGenRef.current !== myGen) {
            return;
          }
          if (msg.type === "error") {
            setChannel("error");
          }
        };

        if (raw !== null) {
          parsePayload(raw);
          return;
        }
        if (ev.data instanceof Blob) {
          void ev.data.text().then((text) => {
            parsePayload(text);
          });
          return;
        }
        parsePayload(String(ev.data));
      });

      ws.addEventListener("error", () => {
        if (cancelled || connectGenRef.current !== myGen) {
          return;
        }
        setChannel("error");
      });

      ws.addEventListener("close", () => {
        // Only clear the ref if this socket is still the active one. A previous socket's `close`
        // can fire after we've already opened a replacement (Strict Mode / reconnect); blindly
        // nulling here left `channel === "ready"` while `wsRef` was null — Validate then reported
        // "not connected" despite the chip showing connected.
        const wasActiveSocket = wsRef.current === ws;
        if (wasActiveSocket) {
          wsRef.current = null;
        }
        if (cancelled || connectGenRef.current !== myGen) {
          return;
        }
        if (!wasActiveSocket) {
          return;
        }
        const hadPending = patchPendingMapRef.current.size > 0;
        if (hadPending) {
          patchPendingMapRef.current.clear();
          if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
          }
          setPreviewBusy(false);
          setPreviewError("Dev channel closed before validation finished.");
        }
        setChannel("idle");
        reconnectTimer = setTimeout(() => {
          retryMs = Math.min(retryMs * 2, 10_000);
          connect();
        }, retryMs);
      });
    };

    connect();

    return () => {
      cancelled = true;
      connectGenRef.current += 1;
      clearTimeout(reconnectTimer);
      if (ws) {
        safeCloseWebSocket(ws);
      }
      wsRef.current = null;
    };
  }, [activeBreakpoint, sendPatchMessage, sendSelect]);

  useEffect(() => {
    const width = devicePreset === "mobile" ? 390 : devicePreset === "tablet" ? 768 : 1280;
    const nextBp: Breakpoint =
      width >= 1280 ? "xl" : width >= 1024 ? "lg" : width >= 768 ? "md" : width >= 640 ? "sm" : "base";
    setActiveBreakpoint(nextBp);
  }, [devicePreset]);

  const channelLabel = channel === "ready" ? "connected" : channel;
  const channelState: NuvioChannelState =
    channel === "ready"
      ? "ready"
      : channel === "connecting"
        ? "connecting"
        : channel === "error"
          ? "error"
          : "idle";

  const chromeUi = (
    <>
      {editMode ? (
        <PropertyPanelShell
          shellRef={panelRef}
          panelCollapsed={chromeLayout.panel.collapsed}
          panelPosition={chromeLayout.panel.position}
          onPanelCollapsedChange={onPanelCollapsedChange}
          onPanelPositionChange={onPanelPositionChange}
          onResetPanelPosition={onResetPanelPosition}
          indexEntries={indexEntries}
          onSelectIndexedId={onSelectId}
          onRequestStructuralPreview={onRequestStructuralPreview}
          selectedId={selectedId}
          resolvedFile={resolvedFile}
          resolvedLine={resolvedLine}
          indexIdCount={knownIds.size}
          knownIds={knownIds}
          duplicateErrors={duplicateErrors}
          selectError={selectError}
          channelReady={channel === "ready"}
          previewSummary={previewSummary}
          previewError={previewError}
          lastPatchError={lastPatchError}
          stagedVersion={stagedVersion}
          previewValidatedFingerprint={previewValidatedFingerprint}
          previewValidatedOps={previewValidatedOps}
          structuralPreviewActive={structuralPreviewActive}
          undoStackDepth={undoStackDepth}
          previewBusy={previewBusy}
          onStagedPatchFingerprint={onStagedPatchFingerprint}
          onRequestPreview={onRequestPreview}
          onRequestApply={onRequestApply}
          onRequestUndo={onRequestUndo}
          onCancelPreview={onCancelPreview}
          runtimeDiagnostics={runtimeDiagnostics}
          developerDetails={developerDetails}
          onDeveloperDetailsChange={onDeveloperDetailsChange}
          activeTextTargetKey={activeTextTargetKey}
          onActiveTextTargetKeyChange={setActiveTextTargetKey}
          hoverTextTargetKey={hoverTextTargetKey}
          onHoverTextTargetKeyChange={setHoverTextTargetKey}
          devicePreset={devicePreset}
          onDevicePresetChange={setDevicePreset}
          activeBreakpoint={activeBreakpoint}
          onActiveBreakpointChange={setActiveBreakpoint}
        />
      ) : null}

      <div
        ref={(el) => assignRef(chipRef, el)}
        style={{
          ...NUVO_GLASS_SHELL_INLINE,
          ...(chipPos
            ? { left: chipPos.x, top: chipPos.y, right: "auto", bottom: "auto" }
            : {}),
        }}
        className={`${NUVO_ROOT} nuvio-chip ${NUVO_GLASS_SHELL} ${chromeLayout.chip.collapsed ? "nuvio-chip--collapsed" : ""} ${
          chipDragging ? "nuvio-chip--dragging" : ""
        }`}
      >
        <div className={NUVO_GLASS_CONTENT}>
          <div
            className={`nuvio-chip-header ${chipDragging ? "nuvio-chip-header--grabbing" : ""}`}
            onPointerDown={onChipHeaderPointerDown}
          >
            <span className="nuvio-chip-title">Nuvio</span>
            <span className="nuvio-chip-spacer" aria-hidden="true" />
            <button
              type="button"
              className="nuvio-button-icon"
              title={chromeLayout.chip.collapsed ? "Expand chip" : "Collapse chip"}
              aria-label={
                chromeLayout.chip.collapsed ? "Expand Nuvio chip" : "Collapse Nuvio chip"
              }
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onChipCollapsedChange(!chromeLayout.chip.collapsed)}
            >
              {chromeLayout.chip.collapsed ? "+" : "−"}
            </button>
            {chromeLayout.chip.collapsed ? null : (
              <button
                type="button"
                className="nuvio-button-icon"
                title="Reset chip position"
                aria-label="Reset chip position"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onResetChipPosition()}
              >
                Reset
              </button>
            )}
            <button
              type="button"
              className={`nuvio-button-chip ${editMode ? "nuvio-button-chip--active" : ""}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                toggleEditMode();
              }}
            >
              {editMode ? "Editing" : "Edit"}
            </button>
          </div>
          {!chromeLayout.chip.collapsed ? (
            <NuvioChipStatus
              channel={channelState}
              channelLabel={channelLabel}
              indexedCount={knownIds.size}
              duplicateErrors={duplicateErrors}
              selectedId={selectedId}
              selectedEntry={selectedEntry}
              indexEntries={indexEntries}
              selectError={selectError}
              developerDetails={developerDetails}
            />
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <>
      <InteractionLayer
        enabled={editMode}
        chromeRootRefs={chromeRootRefs}
        knownIds={knownIds}
        selectedId={selectedId}
        onSelectId={onSelectId}
        textTargetHostId={selectedId}
        textTargets={selectedEntry?.textTargets}
        activeTextTargetKey={activeTextTargetKey}
        hoverTextTargetKey={hoverTextTargetKey}
        suppressTextTargetHints={!developerDetails}
      />
      {shadowMount ? createPortal(chromeUi, shadowMount.mount) : chromeUi}
    </>
  );
}
