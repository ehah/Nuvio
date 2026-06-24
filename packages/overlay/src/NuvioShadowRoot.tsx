import { useEffect, useState } from "react";
import { NUVIO_SHADOW_HOST_ID } from "./nuvio-chrome-hit.js";
import { getOverlayCssHref, getOverlayCssMode } from "./load-overlay-styles.js";

export type NuvioShadowMount = {
  host: HTMLElement;
  mount: HTMLElement;
};

export function useNuvioShadowMount(enabled = true): NuvioShadowMount | null {
  const [mount, setMount] = useState<NuvioShadowMount | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const host = document.createElement("div");
    host.id = NUVIO_SHADOW_HOST_ID;
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = "2147483000";
    host.style.pointerEvents = "none";
    host.style.background = "transparent";

    const shadow = host.attachShadow({ mode: "open" });
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getOverlayCssHref();
    link.setAttribute("data-nuvio-overlay-css-mode", getOverlayCssMode());
    shadow.appendChild(link);

    const portalMount = document.createElement("div");
    portalMount.className = "nuvio-shadow-mount";
    shadow.appendChild(portalMount);

    document.body.appendChild(host);
    setMount({ host, mount: portalMount });

    return () => {
      setMount(null);
      host.remove();
    };
  }, [enabled]);

  return enabled ? mount : null;
}
