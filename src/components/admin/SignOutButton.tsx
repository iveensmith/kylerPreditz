"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="font-medium text-white/70 underline underline-offset-2 transition-colors hover:text-white"
    >
      Sign out
    </button>
  );
}
