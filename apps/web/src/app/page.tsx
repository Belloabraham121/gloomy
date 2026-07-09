"use client";

import { useEffect, useState } from "react";
import { pingChat } from "@/lib/api";

type Status =
  | { kind: "loading" }
  | { kind: "ok"; reply: string }
  | { kind: "error"; message: string };

export default function Home() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    pingChat("ping from apps/web")
      .then((res) => setStatus({ kind: "ok", reply: res.reply }))
      .catch((err) =>
        setStatus({ kind: "error", message: (err as Error).message }),
      );
  }, []);

  return (
    <main>
      <h1>gloomy</h1>
      <p>
        Build order step 1: confirm <code>apps/web</code> and{" "}
        <code>apps/api</code> can talk to each other.
      </p>
      {status.kind === "loading" && (
        <div className="status">Calling apps/api&hellip;</div>
      )}
      {status.kind === "ok" && (
        <div className="status ok">
          Connected. apps/api replied: <code>{status.reply}</code>
        </div>
      )}
      {status.kind === "error" && (
        <div className="status error">
          Could not reach apps/api: <code>{status.message}</code>
          <br />
          Make sure it&apos;s running on the URL in{" "}
          <code>NEXT_PUBLIC_API_URL</code> (defaults to{" "}
          <code>http://localhost:4000</code>).
        </div>
      )}
    </main>
  );
}
