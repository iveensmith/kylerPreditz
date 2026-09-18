"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/lib/actions/verify-email";

/** Shown on the dashboard while the account's email is unverified - premium
 * purchases are blocked until verification, browsing isn't. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  if (dismissed) return null;

  async function handleResend() {
    setStatus("sending");
    await resendVerificationEmail(email);
    setStatus("sent");
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface-2 p-4 text-sm">
      <p className="text-muted">
        Verify your email to unlock Premium purchases.{" "}
        {status === "sent" ? (
          <span className="text-ink">Check your inbox for a new link.</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={status === "sending"}
            className="text-brand underline disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Resend verification email"}
          </button>
        )}
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-faint hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
