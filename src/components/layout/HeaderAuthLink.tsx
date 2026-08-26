"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * Client-side session check, isolated from the rest of the header (and therefore the
 * whole public route tree) on purpose - getServerSession() is a dynamic API, and using
 * it anywhere in (public)/layout.tsx would force every page under it out of static
 * rendering, defeating the generateStaticParams/ISR the SEO phase set up everywhere.
 */
export function HeaderAuthLink() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Link
        href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
        className="rounded-full bg-brand hover:bg-brand-hover transition-colors text-white px-4 py-1.5 font-medium"
      >
        {session.user.role === "ADMIN" ? "Admin" : "Dashboard"}
      </Link>
    );
  }

  return (
    <Link href="/login" className="rounded-full bg-brand hover:bg-brand-hover transition-colors text-white px-4 py-1.5 font-medium">
      Sign In
    </Link>
  );
}
