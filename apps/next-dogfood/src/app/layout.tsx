import type { ReactNode } from "react";
import "./globals.css";
import "@nuvio/overlay/style.css";
import { AppShell } from "@/components/AppShell";
import { NuvioNextShell } from "@nuvio/overlay/next";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
        <NuvioNextShell />
      </body>
    </html>
  );
}
