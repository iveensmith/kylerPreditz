import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getViewerPremium } from "@/lib/premium";
import { getPremiumPicks } from "@/lib/queries/premium";
import { PageHeader } from "@/components/ui/PageHeader";
import { PremiumPicksList } from "@/components/premium/PremiumPicksList";

// Subscriber-only. Session-dependent, and holds picks that are hidden from the
// rest of the site - never static, never indexed.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Premium Picks",
  robots: { index: false, follow: false },
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default async function PremiumPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?next=/premium");

  const { isPremium, expiresAt } = await getViewerPremium();
  if (!isPremium) redirect("/vip");

  const picks = await getPremiumPicks();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <PageHeader
        eyebrow="Premium"
        title="Premium picks"
        subtitle="Our highest-rated selections, published each morning and kept off the public board. These are still statistical estimates, capped at 92% confidence - never a certainty."
      />

      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-brand/30 bg-brand/[0.06] px-4 py-3 text-sm">
        <span className="text-ink/80">
          Membership active until {expiresAt ? formatDate(expiresAt) : "—"}
        </span>
        <Link href="/dashboard" className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-brand hover:underline">
          Account
        </Link>
      </div>

      <PremiumPicksList picks={picks} />

      <p className="border-t border-line pt-5 text-xs text-faint">
        Every Premium result is added to the public{" "}
        <Link href="/results" className="text-brand hover:underline">
          results archive
        </Link>{" "}
        once settled, win or lose. 18+ &middot; Gamble responsibly.
      </p>
    </main>
  );
}
