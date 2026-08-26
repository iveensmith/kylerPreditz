"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })} className="underline hover:text-zinc-700 dark:hover:text-zinc-200">
      Sign out
    </button>
  );
}
