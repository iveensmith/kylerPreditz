"use client";

import { useTransition } from "react";
import { deleteTip } from "@/lib/actions/tips";

export function DeleteTipButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="text-red-600 dark:text-red-400 underline disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Delete this tip? This cannot be undone.")) return;
        startTransition(() => deleteTip(id));
      }}
    >
      Delete
    </button>
  );
}
