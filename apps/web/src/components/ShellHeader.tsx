"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WEB3D_URL = process.env.NEXT_PUBLIC_WEB3D_URL ?? "http://localhost:3002";

export function ShellHeader() {
  const pathname = usePathname();

  return (
    <header className="shell-header">
      <Link href="/" className="shell-wordmark">
        <i aria-hidden />
        gloomy
      </Link>
      <nav className="shell-nav" aria-label="Primary">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
          Chat
        </Link>
        <Link
          href="/gallery"
          aria-current={pathname === "/gallery" ? "page" : undefined}
        >
          Gallery
        </Link>
        <a href={WEB3D_URL}>3D Lab</a>
      </nav>
    </header>
  );
}
