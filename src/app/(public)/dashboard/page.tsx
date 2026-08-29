import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getViewerPremium } from "@/lib/premium";
import { PageHeader } from "@/components/ui/PageHeader";

// Members-only. The full picks view lands here in 7.4; for now it confirms
// membership status and points to where the picks currently are (unlocked
// inline across the site).
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?next=/dashboard");

  const { isPremium, expiresAt } = await getViewerPremium();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <PageHeader eyebrow="Membership" title="Your dashboard" />

      {isPremium ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-card)] border border-brand/30 bg-brand/[0.06] p-5">
            <div className="eyebrow !text-brand">Premium active</div>
            <p className="mt-2 text-sm text-ink/80">
              Your membership runs until {expiresAt ? formatDate(expiresAt) : "—"}. Every Premium pick is
              unlocked for you across the site — the homepage board, market pages and match pages all
              show the full tip, odds and confidence.
            </p>
          </div>
          <p className="text-sm text-muted">
            A dedicated Premium-only picks list lands here in the next update.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-5">
            <div className="eyebrow">No active plan</div>
            <p className="mt-2 text-sm text-muted">
              You&apos;re signed in as{" "}
              <span className="font-medium text-ink">{session.user.email}</span>, but there&apos;s no
              active Premium membership on this account.
            </p>
          </div>
          <Link
            href="/vip"
            className="inline-flex w-fit items-center rounded-[var(--radius-control)] bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Go Premium
          </Link>
        </div>
      )}
    </main>
  );
}
