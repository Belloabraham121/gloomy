import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "gloomy — 3D lab",
  description:
    "Copilot-driven 3D scenes: ask for a visualization and the copilot reconfigures the live render.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b10",
};

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="shell-header">
          <a href={WEB_URL} className="shell-wordmark">
            <i aria-hidden />
            gloomy
          </a>
          <nav className="shell-nav" aria-label="Primary">
            <a href={WEB_URL}>Chat</a>
            <a href={`${WEB_URL}/gallery`}>Gallery</a>
            <a href="/" aria-current="page">
              3D Lab
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
