import type { ReactNode } from "react";
import "./globals.css";
import { NuvioClient } from "@/components/NuvioClient";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <NuvioClient />
      </body>
    </html>
  );
}
