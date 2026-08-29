"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * Client-side session check, isolated from the rest of the header (and therefore the
 * whole public route tree) on purpose - getServerSession() is a dynamic API, and using
 * it anywhere in (public)/layout.tsx would force every page under it out of static
 * rendering, defeating the generateStaticParams/ISR the SEO phase set up everywhere.
 */
const linkClass =
  "rounded-full bg-brand px-4 py-1.5 font-medium text-white transition-colors hover:bg-brand-hover";

export function HeaderAuthLink() {
  const { data: session, status } = useSession();

  // Avoid flashing "Sign in" before the session resolves.
  if (status === "loading") {
    return <span className="h-8 w-20 rounded-full bg-white/10" aria-hidden />;
  }

  if (session) {
    const isAdmin = session.user.role === "ADMIN";
    return (
      <Link href={isAdmin ? "/admin" : "/dashboard"} className={linkClass}>
        {isAdmin ? "Admin" : "Dashboard"}
      </Link>
    );
  }

  return (
    <Link href="/login" className={linkClass}>
      Sign in
    </Link>
  );
}
