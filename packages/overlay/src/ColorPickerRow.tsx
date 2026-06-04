import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { NUVIO_SHADOW_HOST_ID } from "./nuvio-chrome-hit.js";
import type { ColorOption } from "./tailwind-color-options.js";
import {
  TAILWIND_COLOR_FAMILIES,
  TAILWIND_COLOR_SHADES,
  TAILWIND_PALETTE_HEX,
} from "./tailwind-palette-hex.js";

function hexForUtility(value: string, options: readonly ColorOption[]): string {
  if (!value) {
    return "transparent";
  }
  const hit = options.find((o) => o.value === value);
  if (hit) {
    return hit.hex;
  }
  const base = value.replace(/\/(?:\d+|\[[\d.]+\])$/, "");
  const baseHit = options.find((o) => o.value === base);
  if (baseHit) {
    return baseHit.hex;
  }
  const m = base.match(/^(text|bg)-([a-z]+)-(\d+)$/);
  if (m) {
    return TAILWIND_PALETTE_HEX[m[2]]?.[m[3]] ?? "#64748b";
  }
  if (base === "text-white" || base === "bg-white") {
    return "#ffffff";
  }
  if (base === "text-black" || base === "bg-black") {
    return "#000000";
  }
  return "#64748b";
}

function familyLabel(family: string): string {
  return family.charAt(0).toUpperCase() + family.slice(1);
}

function getOverlayPortalRoot(): HTMLElement | null {
  const host = document.getElementById(NUVIO_SHADOW_HOST_ID);
  const mount = host?.shadowRoot?.querySelector(".nuvio-shadow-mount");
  return mount instanceof HTMLElement ? mount : null;
}

type PopoverBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function measurePopoverBox(trigger: HTMLElement): PopoverBox {
  const rect = trigger.getBoundingClientRect();
  const margin = 8;
  const preferredMax = 320;
  const minWidth = 300;
  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;
  const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(120, Math.min(preferredMax, placeAbove ? spaceAbove : spaceBelow));
  const width = Math.min(Math.max(rect.width, minWidth), window.innerWidth - margin * 2);
  let left = rect.left;
  if (left + width > window.innerWidth - margin) {
    left = window.innerWidth - margin - width;
  }
  left = Math.max(margin, left);
  const top = placeAbove ? Math.max(margin, rect.top - maxHeight - 4) : rect.bottom + 4;
  return { top, left, width, maxHeight };
}

export function ColorPickerRow({
  label,
  value,
  onChange,
  options,
  utilityPrefix,
  simpleMode = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly ColorOption[];
  utilityPrefix: "text" | "bg";
  /** Simple Mode: hide utility strings (Rule 0). */
  simpleMode?: boolean;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [popoverBox, setPopoverBox] = useState<PopoverBox | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const swatchHex = hexForUtility(value, options);
  const displayValue = simpleMode
    ? value
      ? options.find((o) => o.value === value)?.label ?? "Custom"
      : "Default"
    : value || "—";

  const updatePopoverBox = (): void => {
    const row = rootRef.current;
    if (!row) {
      return;
    }
    const trigger = row.querySelector(".nuvio-color-trigger");
    if (!(trigger instanceof HTMLElement)) {
      return;
    }
    setPopoverBox(measurePopoverBox(trigger));
  };

  useLayoutEffect(() => {
    if (!open) {
      setPopoverBox(null);
      return;
    }
    updatePopoverBox();
    window.addEventListener("resize", updatePopoverBox);
    const panelBody = rootRef.current?.closest(".nuvio-panel-body");
    panelBody?.addEventListener("scroll", updatePopoverBox, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePopoverBox);
      panelBody?.removeEventListener("scroll", updatePopoverBox);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent): void => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      const clickedInside =
        path.includes(root) ||
        root.contains(e.target as Node) ||
        path.some(
          (node) =>
            node instanceof HTMLElement &&
            (node.id === listId || node.classList.contains("nuvio-color-popover")),
        );
      if (!clickedInside) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const specials = options.filter(
    (o) =>
      !o.value ||
      o.value === `${utilityPrefix}-white` ||
      o.value === `${utilityPrefix}-black` ||
      o.value === "bg-transparent",
  );

  const pick = (next: string): void => {
    onChange(next);
    setOpen(false);
  };

  const popoverStyle: CSSProperties | undefined = popoverBox
    ? {
        position: "fixed",
        top: popoverBox.top,
        left: popoverBox.left,
        width: popoverBox.width,
        maxHeight: popoverBox.maxHeight,
        zIndex: 2_147_483_640,
      }
    : undefined;

  const popover =
    open && popoverBox ? (
      <div
        id={listId}
        role="listbox"
        aria-label={`${label} palette`}
        className="nuvio-color-popover nuvio-color-popover--fixed"
        style={popoverStyle}
      >
        {!simpleMode ? (
          <p
            className="nuvio-text-3xs nuvio-leading-snug nuvio-text-muted"
            style={{ marginBottom: 8 }}
          >
            Tailwind palette — picks a utility class (e.g. {utilityPrefix}-sky-500), not a custom
            hex value.
          </p>
        ) : null}
        <div className="nuvio-color-specials">
          {specials.map((o) => (
            <button
              key={o.value || "__none"}
              type="button"
              role="option"
              aria-selected={value === o.value}
              title={o.label}
              className={`nuvio-color-special-btn ${
                value === o.value ? "nuvio-color-special-btn--active" : ""
              }`}
              onClick={() => pick(o.value)}
            >
              <span className="nuvio-color-swatch--sm" style={{ backgroundColor: o.hex }} />
              {o.label}
            </button>
          ))}
        </div>
        <div
          className="nuvio-palette-grid"
          style={{
            gridTemplateColumns: `3.25rem repeat(${TAILWIND_COLOR_SHADES.length}, minmax(0, 1fr))`,
          }}
        >
          <span />
          {TAILWIND_COLOR_SHADES.map((s) => (
            <span key={s} className="nuvio-palette-shade">
              {s}
            </span>
          ))}
          {TAILWIND_COLOR_FAMILIES.map((family) => (
            <div key={family} className="nuvio-palette-contents">
              <span className="nuvio-palette-family">{familyLabel(family)}</span>
              {TAILWIND_COLOR_SHADES.map((shade) => {
                const util = `${utilityPrefix}-${family}-${shade}`;
                const hex = TAILWIND_PALETTE_HEX[family][String(shade)];
                const selected =
                  value === util || value.replace(/\/(?:\d+|\[[\d.]+\])$/, "") === util;
                return (
                  <button
                    key={util}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    title={simpleMode ? `${familyLabel(family)} ${shade}` : util}
                    className={`nuvio-palette-swatch ${
                      selected ? "nuvio-palette-swatch--selected" : ""
                    }`}
                    style={{ backgroundColor: hex }}
                    onClick={() => pick(util)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    ) : null;

  const portalRoot = open ? getOverlayPortalRoot() : null;

  return (
    <div ref={rootRef} className="nuvio-field-row nuvio-field-row--start">
      <span className="nuvio-label nuvio-label--pad-top">{label}</span>
      <div className="nuvio-min-w-0 nuvio-relative">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listId : undefined}
          className="nuvio-color-trigger"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className="nuvio-color-swatch"
            style={{
              backgroundColor: swatchHex,
              backgroundImage:
                !value || value.includes("transparent")
                  ? "linear-gradient(45deg, #475569 25%, transparent 25%), linear-gradient(-45deg, #475569 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #475569 75%), linear-gradient(-45deg, transparent 75%, #475569 75%)"
                  : undefined,
              backgroundSize: !value || value.includes("transparent") ? "6px 6px" : undefined,
              backgroundPosition:
                !value || value.includes("transparent")
                  ? "0 0, 0 3px, 3px -3px, -3px 0"
                  : undefined,
            }}
            aria-hidden="true"
          />
          <span className="nuvio-min-w-0 nuvio-truncate nuvio-text-2xs">{displayValue}</span>
        </button>
        {portalRoot && popover ? createPortal(popover, portalRoot) : null}
      </div>
    </div>
  );
}
