import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { CONTACT } from "@/lib/contact.config";
import { getViewerPremium, PREMIUM_CONFIDENCE_FLOOR } from "@/lib/premium";
import { LegalPageShell, Section } from "@/components/layout/LegalPageShell";
import { PlanCards } from "@/components/premium/PlanCards";

const DESCRIPTION = `${SITE_NAME} Premium - our highest-rated football selections, published every morning behind a small subscription.`;

export const metadata: Metadata = {
  title: "Premium Plans",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/vip") },
  openGraph: { title: `Premium Plans | ${SITE_NAME}`, description: DESCRIPTION, url: absoluteUrl("/vip") },
};

// Session-dependent (shows your membership state + a checkout button).
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

type Props = { searchParams: Promise<{ checkout?: string }> };

export default async function VipPage({ searchParams }: Props) {
  const { checkout } = await searchParams;
  const session = await getServerSession(authOptions);
  const { isPremium, expiresAt } = session ? await getViewerPremium() : { isPremium: false, expiresAt: null };

  return (
    <LegalPageShell
      title="Go Premium"
      intro={`The free board covers every fixture. Premium is the short list our model rates highest — anything at ${PREMIUM_CONFIDENCE_FLOOR}% confidence — kept off the public site and published to members each morning.`}
    >
      {checkout === "unavailable" && (
        <div className="rounded-[var(--radius-card)] border border-loss/40 bg-loss/[0.08] p-4 text-sm">
          We couldn&apos;t start the checkout just now — nothing was charged. Please try again in a moment. If it
          keeps happening,{" "}
          <a href={CONTACT.whatsapp.href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-hover underline dark:text-brand-light">
            message us
          </a>
          .
        </div>
      )}
      {checkout === "failed" && (
        <div className="rounded-[var(--radius-card)] border border-loss/40 bg-loss/[0.08] p-4 text-sm">
          That payment didn&apos;t go through. Nothing was charged — pick a plan below to try again.
        </div>
      )}
      {checkout === "error" && (
        <div className="rounded-[var(--radius-card)] border border-loss/40 bg-loss/[0.08] p-4 text-sm">
          Your payment went through but we couldn&apos;t activate your membership automatically. Send us your
          account email and we&apos;ll switch it on right away — you won&apos;t be charged again.
        </div>
      )}

      {!session ? (
        <div className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-4 text-sm">
          You&apos;ll need an account to subscribe.{" "}
          <Link href="/register?next=/vip" className="font-medium text-brand-hover underline dark:text-brand-light">
            Create one
          </Link>{" "}
          or{" "}
          <Link href="/login?next=/vip" className="font-medium text-brand-hover underline dark:text-brand-light">
            sign in
          </Link>
          .
        </div>
      ) : isPremium ? (
        <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-brand/30 bg-brand/[0.06] p-4 text-sm">
          <span className="text-ink/80">
            You&apos;re a Premium member{expiresAt ? ` until ${formatDate(expiresAt)}` : ""}.
          </span>
          <Link href="/premium" className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-brand hover:underline">
            View picks
          </Link>
        </div>
      ) : null}

      <Section heading="Plans">
        <PlanCards subscribable={Boolean(session)} />
        <p className="text-xs text-muted">
          Paid by card through Paystack. A renewal adds to whatever time you have left.
        </p>
      </Section>

      <Section heading="What you get">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Every Premium pick on your Premium page, the moment it&apos;s published</li>
          <li>The full market grid, odds and write-up on each Premium fixture</li>
          <li>Every Premium result stays on the public record — see the archive</li>
          <li>A direct line to us for questions on any selection</li>
        </ul>
      </Section>

      <Section heading="How it works">
        <ol className="flex list-decimal flex-col gap-1.5 pl-5">
          <li>Create an account (or sign in) and pick a plan.</li>
          <li>Pay by card on Paystack&apos;s secure page — we never see your card details.</li>
          <li>You land back on your Premium page with the picks unlocked.</li>
        </ol>
      </Section>

      <Section heading="Prefer to ask first?">
        <p>
          Message us on whichever channel suits you:
          <br />
          WhatsApp:{" "}
          <a href={CONTACT.whatsapp.href} target="_blank" rel="noopener noreferrer" className="text-brand-hover underline dark:text-brand-light">
            {CONTACT.whatsapp.number}
          </a>
          <br />
          Telegram:{" "}
          <a href={CONTACT.telegramChat.href} target="_blank" rel="noopener noreferrer" className="text-brand-hover underline dark:text-brand-light">
            {CONTACT.telegramChat.handle}
          </a>
        </p>
      </Section>

      <Section heading="The honest part">
        <p>
          Premium selections are still statistical estimates, capped at 92% confidence. A higher rating means a
          better chance, not a certain result. Losing runs happen and they stay in the{" "}
          <Link href="/results" className="text-brand-hover underline dark:text-brand-light">
            results archive
          </Link>{" "}
          like everything else. You must be 18+. Only stake what you can afford to lose. The subscription pays
          for access to the selections, not a guarantee of profit.
        </p>
      </Section>
    </LegalPageShell>
  );
}
