"use client";

import { useState, useTransition } from "react";
import { updateGamesToday } from "@/lib/actions/system";
import { adminInput } from "@/lib/admin-ui";

export function GamesTodayToggle({ initial }: { initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface-2 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Are there matches today?</h2>
          <p className="mt-1 text-xs text-muted">
            Choose &quot;No&quot; on a day with no fixtures worth tipping. The homepage&apos;s today view then shows a
            &quot;no matches today&quot; notice instead of an empty list. Other dates are unaffected.
          </p>
        </div>
        <select
          aria-label="Are there matches today?"
          value={value ? "yes" : "no"}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value === "yes";
            const prev = value;
            setValue(next);
            setMsg(null);
            startTransition(async () => {
              const res = await updateGamesToday(next);
              if (res && "error" in res) {
                setValue(prev);
                setMsg({ text: res.error, error: true });
              } else if (res && "ok" in res) setMsg({ text: res.ok });
            });
          }}
          className={`${adminInput} sm:w-56`}
        >
          <option value="yes">Yes, there are matches</option>
          <option value="no">No matches today</option>
        </select>
      </div>
      {msg && (
        <p role="status" className={`mt-3 text-xs ${msg.error ? "text-loss" : "text-muted"}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
