"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * Top-of-page call to action on /vip. Phase 7.2: routes logged-out visitors
 * into registration. Phase 7.3 will replace the signed-in branch with the real
 * Paystack plan buttons.
 */
export function GoPremiumCta() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-11 rounded-[var(--radius-control)] bg-surface-2" aria-hidden />;
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href="/register?next=/vip"
          className="inline-flex w-fit items-center rounded-[var(--radius-control)] bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Create your account
        </Link>
        <p className="text-xs text-muted">
          Already a member?{" "}
          <Link href="/login?next=/vip" className="text-brand underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-4 text-sm">
        Signed in as <span className="font-medium text-ink">{session.user.email}</span>. Card checkout
        is being switched on — for now, message us on WhatsApp or Telegram to activate a plan.
      </div>
      <p className="text-xs text-muted">
        Already subscribed?{" "}
        <Link href="/dashboard" className="text-brand underline">
          Check your membership
        </Link>
      </p>
    </div>
  );
}
