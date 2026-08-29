import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { CONTACT } from "@/lib/contact.config";
import { LegalPageShell, Section } from "@/components/layout/LegalPageShell";

const DESCRIPTION = `${SITE_NAME} VIP - a short daily list of our highest-conviction football selections, delivered on Telegram and WhatsApp.`;

export const metadata: Metadata = {
  title: "VIP Packages",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/vip") },
  openGraph: { title: `VIP Packages | ${SITE_NAME}`, description: DESCRIPTION, url: absoluteUrl("/vip") },
};

const PACKAGES = [
  { name: "Daily", blurb: "One day of VIP selections. Good for trying it out." },
  { name: "Weekly", blurb: "Seven days of VIP selections at a lower daily rate." },
  { name: "Monthly", blurb: "Full month of VIP selections - the best value." },
];

export default function VipPage() {
  return (
    <LegalPageShell
      title="VIP Packages"
      intro="The free page covers every fixture. VIP is the opposite - a small, filtered list of the selections our model is most confident in, sent to you directly."
    >
      <Section heading="What you get">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>A short daily slip of our highest-confidence picks, not the full board</li>
          <li>Delivered on Telegram and WhatsApp as soon as it&apos;s ready</li>
          <li>Every VIP result still goes on the public record - see the archive</li>
          <li>Direct line to us for questions on any selection</li>
        </ul>
      </Section>

      <Section heading="Packages">
        <div className="grid gap-3 sm:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border border-line p-4 flex flex-col gap-2"
            >
              <div className="font-semibold text-ink">{p.name}</div>
              <p className="text-xs text-muted">{p.blurb}</p>
              <div className="text-xs font-medium text-brand-hover dark:text-brand-light mt-auto pt-2">
                Message us for current pricing
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section heading="How to join">
        <p>
          Payment is handled over Paystack once you&apos;ve picked a package. To get started, message us on
          whichever channel suits you:
        </p>
        <p>
          WhatsApp:{" "}
          <a href={CONTACT.whatsapp.href} target="_blank" rel="noopener noreferrer" className="text-brand-hover dark:text-brand-light underline">
            {CONTACT.whatsapp.number}
          </a>
          <br />
          Telegram:{" "}
          <a href={CONTACT.telegramChat.href} target="_blank" rel="noopener noreferrer" className="text-brand-hover dark:text-brand-light underline">
            {CONTACT.telegramChat.handle}
          </a>
          <br />
          Telegram channel:{" "}
          <a href={CONTACT.telegramChannel.href} target="_blank" rel="noopener noreferrer" className="text-brand-hover dark:text-brand-light underline">
            join here
          </a>
        </p>
      </Section>

      <Section heading="The honest part">
        <p>
          VIP selections are still statistical estimates. A higher confidence rating means a better chance,
          not a certain result. Losing runs happen and they stay in the{" "}
          <Link href="/results" className="text-brand-hover dark:text-brand-light underline">
            results archive
          </Link>{" "}
          like everything else. You must be 18+. Only stake what you can afford to lose. Subscription fees
          are for access to the selections, not a guarantee of profit.
        </p>
      </Section>
    </LegalPageShell>
  );
}
