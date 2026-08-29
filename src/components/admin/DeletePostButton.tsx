"use client";

import { useTransition } from "react";
import { deletePost } from "@/lib/actions/blog";

export function DeletePostButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="text-loss underline disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Delete this post? This cannot be undone.")) return;
        startTransition(() => deletePost(id));
      }}
    >
      Delete
    </button>
  );
}
