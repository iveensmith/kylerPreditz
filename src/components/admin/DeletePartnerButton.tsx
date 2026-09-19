"use client";

import { useState, useTransition } from "react";
import { deletePartner } from "@/lib/actions/partners";

export function DeletePartnerButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-xs text-loss">{error}</span>}
      <button
        type="button"
        disabled={pending}
        className="text-sm text-loss underline disabled:opacity-50"
        onClick={() => {
          if (!window.confirm(`Delete partner "${name}"? This cannot be undone.`)) return;
          startTransition(async () => {
            const res = await deletePartner(id);
            setError(res && "error" in res ? res.error : null);
          });
        }}
      >
        Delete
      </button>
    </span>
  );
}
