const STYLE_LINK_ID = "nuvio-overlay-styles";

export type OverlayCssMode = "source" | "dist";

export function getOverlayCssMode(): OverlayCssMode {
  const { url } = import.meta;
  return url.includes("/dist/") ? "dist" : "source";
}

export function getOverlayCssHref(): string {
  const { url } = import.meta;
  const mode = getOverlayCssMode();
  const cssFile = mode === "dist" ? "./style.css" : "./styles/overlay.css";
  return new URL(cssFile, url).href;
}

/**
 * Inject compiled overlay CSS once. Works from published `dist/` (`style.css` sibling)
 * and from source during monorepo dev (`styles/overlay.css` via Vite).
 */
export function loadOverlayStyles(): void {
  if (typeof document === "undefined") {
    return;
  }
  if (document.getElementById(STYLE_LINK_ID)) {
    return;
  }

  const link = document.createElement("link");
  link.id = STYLE_LINK_ID;
  link.rel = "stylesheet";
  // Published `dist/index.js` ships `style.css` sibling; monorepo dev resolves `src/index.tsx`.
  const mode = getOverlayCssMode();
  link.href = getOverlayCssHref();
  link.setAttribute("data-nuvio-overlay-css-mode", mode);
  document.head.appendChild(link);
}
