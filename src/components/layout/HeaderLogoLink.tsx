"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/seo";
import { Logo } from "./Logo";

/**
 * Header brand link. Points at "/" for normal navigation, but when you're
 * already on the homepage a click just scrolls back to the top instead of
 * being a no-op.
 */
export function HeaderLogoLink() {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      className="shrink-0"
      aria-label={`${SITE_NAME} home`}
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      <Logo className="h-10 w-auto" />
    </Link>
  );
}
