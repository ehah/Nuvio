"use client";

import { NuvioDevShell } from "@nuvio/overlay";
import "@nuvio/overlay/style.css";

export function NuvioClient() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return <NuvioDevShell />;
}
