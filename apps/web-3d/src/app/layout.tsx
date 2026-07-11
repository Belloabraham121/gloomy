import type { Metadata, Viewport } from "next";
import { ShellHeader } from "@/components/ShellHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "gloomy — 3D lab",
  description:
    "Copilot-driven 3D scenes: ask for a visualization and the copilot reconfigures the live render.",
};

export const viewport: Viewport = {
  themeColor: "#eaf4fb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ShellHeader />
        {children}
      </body>
    </html>
  );
}
