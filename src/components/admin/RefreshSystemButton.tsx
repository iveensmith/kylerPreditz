"use client";

import { useState, useTransition } from "react";
import { refreshSystem } from "@/lib/actions/system";

export function RefreshSystemButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await refreshSystem();
            if (res && "error" in res) setMsg({ text: res.error, error: true });
            else if (res && "ok" in res) setMsg({ text: res.ok });
          })
        }
        className="flex size-36 items-center justify-center rounded-full bg-loss px-6 text-center text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Refreshing…" : "Refresh system"}
      </button>
      {msg && (
        <p role="status" className={`max-w-sm text-center text-xs ${msg.error ? "text-loss" : "text-muted"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
