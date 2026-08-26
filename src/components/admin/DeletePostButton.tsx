"use client";

import { useTransition } from "react";
import { deletePost } from "@/lib/actions/blog";

export function DeletePostButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="text-red-600 dark:text-red-400 underline disabled:opacity-50"
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
