"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";

const WEB3D_URL = process.env.NEXT_PUBLIC_WEB3D_URL ?? "http://localhost:3002";

export function ShellHeader() {
  const pathname = usePathname();
  const onLanding = pathname === "/";
  const [open, setOpen] = useState(false);

  return (
    <header className="shell-header">
      <Link href="/" className="shell-wordmark" onClick={() => setOpen(false)}>
        <Logo size={26} variant="ink" />
      </Link>
      <button
        type="button"
        className={`shell-nav-toggle ${open ? "open" : ""}`}
        aria-expanded={open}
        aria-controls="shell-nav"
        aria-label="Toggle navigation menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        id="shell-nav"
        className={`shell-nav ${open ? "open" : ""}`}
        aria-label="Primary"
      >
        <Link
          href="/"
          aria-current={onLanding ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          Home
        </Link>
        <Link
          href="/chat"
          aria-current={pathname === "/chat" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          Chat
        </Link>
        <Link
          href="/gallery"
          aria-current={pathname === "/gallery" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          Gallery
        </Link>
        <a href={WEB3D_URL} onClick={() => setOpen(false)}>
          3D Lab
        </a>
      </nav>
    </header>
  );
}
