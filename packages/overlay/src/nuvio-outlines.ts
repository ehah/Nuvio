import { escapeAttrSelector } from "./nuvio-dom.js";

export function clearNuvioOutlines(): void {
  document.querySelectorAll("[data-nuvio-outline]").forEach((n) => {
    const el = n as HTMLElement;
    el.removeAttribute("data-nuvio-outline");
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.boxShadow = "";
  });
}

export function paintNuvioOutline(id: string, mode: "hover" | "selected"): void {
  const el = document.querySelector(
    `[data-nuvio-id="${escapeAttrSelector(id)}"]`,
  ) as HTMLElement | null;
  if (!el) {
    return;
  }
  paintNuvioOutlineElement(el, mode);
}

export function paintNuvioOutlineElement(
  el: HTMLElement,
  mode: "hover" | "selected" | "target-hover" | "target-active",
): void {
  el.setAttribute("data-nuvio-outline", mode);
  el.style.outline = "none";
  el.style.outlineOffset = "0";

  if (mode === "selected") {
    el.style.boxShadow =
      "0 0 0 2px rgb(14 165 233), 0 0 0 5px rgba(14, 165, 233, 0.12)";
  } else if (mode === "target-active") {
    el.style.boxShadow =
      "0 0 0 2px rgb(34 211 238), 0 0 0 4px rgba(34, 211, 238, 0.1)";
  } else if (mode === "target-hover") {
    el.style.boxShadow = "0 0 0 1px rgba(56, 189, 248, 0.9)";
  } else {
    el.style.boxShadow = "0 0 0 1px rgba(56, 189, 248, 0.65)";
  }
}
