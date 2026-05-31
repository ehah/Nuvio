import { useEffect, useId, useRef, useState, type ReactElement } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const swatchHex = hexForUtility(value, options);
  const displayValue = simpleMode
    ? value
      ? options.find((o) => o.value === value)?.label ?? "Custom"
      : "Default"
    : value || "—";

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent): void => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      // In Shadow DOM, document-level events can be retargeted to the host.
      // Use composedPath so palette clicks are not mistaken for outside clicks.
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      const clickedInside = path.includes(root) || root.contains(e.target as Node);
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
          <span className="nuvio-min-w-0 nuvio-truncate nuvio-text-2xs">
            {displayValue}
          </span>
        </button>

        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-label={`${label} palette`}
            className="nuvio-color-popover"
          >
            {!simpleMode ? (
              <p className="nuvio-text-3xs nuvio-leading-snug nuvio-text-muted" style={{ marginBottom: 8 }}>
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
                  <span
                    className="nuvio-color-swatch--sm"
                    style={{ backgroundColor: o.hex }}
                  />
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
        ) : null}
      </div>
    </div>
  );
}
