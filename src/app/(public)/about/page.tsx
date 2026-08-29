import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { CONTACT } from "@/lib/contact.config";
import { LegalPageShell, Section } from "@/components/layout/LegalPageShell";

const DESCRIPTION = `How ${SITE_NAME} builds its football predictions - a statistical goals model, an honest results archive, and a VIP tier.`;

export const metadata: Metadata = {
  title: "About Us",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: { title: `About Us | ${SITE_NAME}`, description: DESCRIPTION, url: absoluteUrl("/about") },
};

export default function AboutPage() {
  return (
    <LegalPageShell
      title="About Us"
      intro={`${SITE_NAME} is a football prediction service built around one idea: publish the numbers, then show whether they worked.`}
    >
      <Section heading="What we do">
        <p>
          Every day we list the fixtures from the leagues we cover with a suggested betting market, an
          indicative price, and a confidence rating. Those ratings come from our own engine, not from a
          tipster&apos;s gut feeling.
        </p>
      </Section>

      <Section heading="How the predictions are made">
        <p>
          The core is a Poisson / Dixon-Coles goals model. It estimates each team&apos;s attacking and
          defensive strength from recent results, weighted by whether they were playing home or away, and
          turns that into a probability for every market we publish. A review layer then adjusts for late
          team news - injuries, suspensions, rotation - before a tip goes out.
        </p>
        <p>
          Confidence is a modelled probability, capped at 92%. It is an estimate of how likely an outcome
          is, never a promise that it will happen.
        </p>
      </Section>

      <Section heading="The results archive">
        <p>
          Every tip we publish is settled and kept in the{" "}
          <Link href="/results" className="text-brand-hover dark:text-brand-light underline">
            public results archive
          </Link>
          , win or loss. Nothing is edited or removed. If a week goes badly, it stays on the record.
        </p>
      </Section>

      <Section heading="VIP">
        <p>
          Alongside the free tips we run a{" "}
          <Link href="/vip" className="text-brand-hover dark:text-brand-light underline">
            VIP tier
          </Link>{" "}
          - a shorter daily list of our highest-conviction selections, sent directly on Telegram and
          WhatsApp.
        </p>
      </Section>

      <Section heading="Talk to us">
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
          <br />
          Email:{" "}
          <a href={CONTACT.email.href} className="text-brand-hover dark:text-brand-light underline">
            {CONTACT.email.address}
          </a>
        </p>
      </Section>

      <Section heading="A note on betting">
        <p>
          Predictions are statistical estimates, not guaranteed outcomes. Betting carries financial risk.
          You must be 18 or older (or the legal age where you live). Never stake more than you can afford
          to lose.
        </p>
      </Section>
    </LegalPageShell>
  );
}
