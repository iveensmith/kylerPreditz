"use client";

import { useState, useTransition } from "react";
import { deletePost } from "@/lib/actions/blog";

export function DeletePostButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
    {error && <span className="text-xs text-loss">{error}</span>}
    <button
      className="text-loss underline disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Delete this post? This cannot be undone.")) return;
        startTransition(async () => {
          const res = await deletePost(id);
          setError(res && "error" in res ? res.error : null);
        });
      }}
    >
      Delete
    </button>
    </>
  );
}
