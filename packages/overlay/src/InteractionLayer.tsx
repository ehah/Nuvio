import type { TextWireTarget } from "@nuvio/shared";
import type { RefObject } from "react";
import { useEffect, useState, type ReactElement } from "react";
import { isNuvioChromeComposedPath } from "./nuvio-chrome-hit.js";
import { resolveTextTargetElement } from "./text-target-dom.js";
import {
  clearNuvioOutlines,
  paintNuvioOutline,
  paintNuvioOutlineElement,
} from "./nuvio-outlines.js";

export type InteractionLayerProps = {
  enabled: boolean;
  chromeRootRefs: readonly RefObject<HTMLElement | null>[];
  knownIds: ReadonlySet<string>;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  /** Index v3: highlight alternate text targets under the selected host. */
  textTargetHostId?: string | null;
  textTargets?: readonly TextWireTarget[];
  activeTextTargetKey?: string | null;
  hoverTextTargetKey?: string | null;
  /** When true, only outline the selected id — no multi text-target hints. */
  suppressTextTargetHints?: boolean;
};

function isUnderOverlayChrome(
  node: HTMLElement,
  chromeRootRefs: readonly RefObject<HTMLElement | null>[],
): boolean {
  for (const ref of chromeRootRefs) {
    const root = ref.current;
    if (root?.contains(node)) {
      return true;
    }
  }
  return false;
}

function pickIndexedTarget(
  clientX: number,
  clientY: number,
  chromeRootRefs: readonly RefObject<HTMLElement | null>[],
  knownIds: ReadonlySet<string>,
): HTMLElement | null {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const node of stack) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (isUnderOverlayChrome(node, chromeRootRefs)) {
      continue;
    }
    const host = node.closest("[data-nuvio-id]");
    if (!(host instanceof HTMLElement)) {
      continue;
    }
    const id = host.getAttribute("data-nuvio-id")?.trim() ?? "";
    if (!id) {
      continue;
    }
    if (knownIds.size > 0 && !knownIds.has(id)) {
      continue;
    }
    return host;
  }
  return null;
}

export function InteractionLayer({
  enabled,
  chromeRootRefs,
  knownIds,
  selectedId,
  onSelectId,
  textTargetHostId = null,
  textTargets = [],
  activeTextTargetKey = null,
  hoverTextTargetKey = null,
  suppressTextTargetHints = false,
}: InteractionLayerProps): ReactElement | null {
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHoverId(null);
      return;
    }

    const onMove = (e: MouseEvent) => {
      if (isNuvioChromeComposedPath(e)) {
        setHoverId(null);
        return;
      }
      const el = pickIndexedTarget(e.clientX, e.clientY, chromeRootRefs, knownIds);
      const id = el?.getAttribute("data-nuvio-id") ?? null;
      setHoverId(id);
    };

    const onClick = (e: MouseEvent) => {
      if (isNuvioChromeComposedPath(e)) {
        return;
      }
      const el = pickIndexedTarget(e.clientX, e.clientY, chromeRootRefs, knownIds);
      if (!el) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const id = el.getAttribute("data-nuvio-id");
      if (id) {
        onSelectId(id);
      }
    };

    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      setHoverId(null);
    };
  }, [chromeRootRefs, enabled, knownIds, onSelectId]);

  useEffect(() => {
    clearNuvioOutlines();
    if (!enabled) {
      return;
    }
    const hoverPaint = hoverId && hoverId !== selectedId ? hoverId : null;
    if (hoverPaint) {
      paintNuvioOutline(hoverPaint, "hover");
    }

    const showTargetHints =
      !suppressTextTargetHints &&
      textTargetHostId &&
      selectedId === textTargetHostId &&
      textTargets.length > 1;

    if (showTargetHints && textTargetHostId) {
      for (const target of textTargets) {
        const el = resolveTextTargetElement(textTargetHostId, target);
        if (!el) {
          continue;
        }
        if (target.key === activeTextTargetKey) {
          paintNuvioOutlineElement(el, "target-active");
        } else if (target.key === hoverTextTargetKey) {
          paintNuvioOutlineElement(el, "target-hover");
        }
      }
      paintNuvioOutline(textTargetHostId, "selected");
    } else if (selectedId) {
      paintNuvioOutline(selectedId, "selected");
    }
  }, [
    enabled,
    hoverId,
    selectedId,
    textTargetHostId,
    textTargets,
    activeTextTargetKey,
    suppressTextTargetHints,
  ]);

  return null;
}
