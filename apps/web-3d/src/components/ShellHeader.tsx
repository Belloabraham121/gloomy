"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export function ShellHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="shell-header">
      <a href={WEB_URL} className="shell-wordmark" onClick={() => setOpen(false)}>
        <Logo size={26} variant="ink" />
      </a>
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
        <a href={WEB_URL} onClick={() => setOpen(false)}>
          Home
        </a>
        <a href={`${WEB_URL}/chat`} onClick={() => setOpen(false)}>
          Chat
        </a>
        <a href="/" aria-current="page" onClick={() => setOpen(false)}>
          3D Lab
        </a>
      </nav>
    </header>
  );
}
