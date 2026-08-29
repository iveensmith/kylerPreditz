import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { LegalPageShell, Section } from "@/components/layout/LegalPageShell";

const DESCRIPTION = `${SITE_NAME} disclaimer - predictions are statistical estimates, not guaranteed outcomes, and betting carries risk.`;

export const metadata: Metadata = {
  title: "Disclaimer",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/disclaimer") },
  openGraph: { title: `Disclaimer | ${SITE_NAME}`, description: DESCRIPTION, url: absoluteUrl("/disclaimer") },
};

export default function DisclaimerPage() {
  return (
    <LegalPageShell title="Disclaimer" updated="August 2026">
      <Section heading="Predictions are estimates">
        <p>
          Everything published on {SITE_NAME} - suggested markets, odds, and confidence ratings - is the
          output of a statistical model. It is our best estimate of what is likely, not a statement of
          fact and not a guaranteed outcome. Football is unpredictable and any selection can lose.
        </p>
      </Section>

      <Section heading="Confidence ratings">
        <p>
          A confidence percentage is a modelled probability. It is capped at 92% and a high figure is
          never a promise. We do not describe any tip as certain, fixed, or a sure thing, and you should
          treat anyone who does with suspicion.
        </p>
      </Section>

      <Section heading="We are not a bookmaker">
        <p>
          {SITE_NAME} does not accept bets or handle stakes. Odds shown are indicative and will differ
          from the price your bookmaker offers at the time you bet.
        </p>
      </Section>

      <Section heading="Your responsibility">
        <p>
          Any bet you place based on this site is your decision and your risk. You must be at least 18
          years old, or the legal gambling age in your jurisdiction, and betting must be legal where you
          are. Never stake money you cannot afford to lose. To the fullest extent permitted by law,
          {" "}{SITE_NAME} accepts no liability for any loss or damage arising from use of, or reliance on,
          the content on this site.
        </p>
      </Section>

      <Section heading="The results archive">
        <p>
          Our{" "}
          <Link href="/results" className="text-brand-hover dark:text-brand-light underline">
            results archive
          </Link>{" "}
          records every settled tip, winning and losing, and is never edited or deleted. It is there so
          you can judge the model&apos;s real record rather than a curated highlight reel.
        </p>
      </Section>

      <Section heading="Responsible gambling">
        <p>
          If gambling is affecting you or someone close to you, support is available. Set deposit and time
          limits with your bookmaker, take breaks, and reach out to a national helpline or organisation
          such as BeGambleAware or GamCare.
        </p>
      </Section>
    </LegalPageShell>
  );
}
