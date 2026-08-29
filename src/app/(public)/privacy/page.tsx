import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { CONTACT } from "@/lib/contact.config";
import { LegalPageShell, Section } from "@/components/layout/LegalPageShell";

const DESCRIPTION = `How ${SITE_NAME} collects, uses, and protects your personal information.`;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/privacy") },
  openGraph: { title: `Privacy Policy | ${SITE_NAME}`, description: DESCRIPTION, url: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      intro={`This policy explains what ${SITE_NAME} does with your information. We keep collection to the minimum needed to run the site.`}
      updated="August 2026"
    >
      <Section heading="What we collect">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Account details</strong> - the name and email address you register with, and your
            sign-in state.
          </li>
          <li>
            <strong>Subscription status</strong> - which VIP package you hold and when it expires. Card
            and bank details are entered on Paystack and handled entirely by Paystack; we never see or
            store them.
          </li>
          <li>
            <strong>Contact you send us</strong> - messages you send over WhatsApp, Telegram, or email.
          </li>
          <li>
            <strong>Technical data</strong> - standard server logs (IP address, browser, pages requested)
            and aggregate, non-identifying usage statistics used to keep the site working and improve it.
          </li>
        </ul>
      </Section>

      <Section heading="Cookies">
        <p>We use a small number of cookies, none of them for advertising:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>a session cookie to keep you signed in;</li>
          <li>a preference cookie that remembers your light or dark theme choice.</li>
        </ul>
        <p>
          We do not use browser local storage or third-party ad-tracking cookies. Blocking the session
          cookie will stop you being able to sign in.
        </p>
      </Section>

      <Section heading="How we use your information">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>to create and secure your account;</li>
          <li>to give you access to VIP content you have paid for;</li>
          <li>to reply to your messages and provide support;</li>
          <li>to monitor, protect, and improve the site.</li>
        </ul>
        <p>We do not sell your personal information, and we do not send marketing email you didn&apos;t ask for.</p>
      </Section>

      <Section heading="Who we share it with">
        <p>
          Only the service providers we need to run {SITE_NAME}: our hosting and database provider,
          Paystack for payments, and our authentication provider. Each processes data on our behalf under
          their own terms. We may also disclose information if required by law.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          Account and subscription records are kept for as long as your account is open and for a
          reasonable period afterwards to meet legal and accounting obligations. Server logs are rotated
          on a short cycle. You can ask us to delete your account at any time.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You can ask us to show you the personal data we hold about you, correct it, or delete it, and
          you can withdraw consent or object to certain processing. Email us and we will respond within a
          reasonable time.
        </p>
      </Section>

      <Section heading="Security">
        <p>
          Data is transmitted over HTTPS and stored with access controls. No system is perfectly secure,
          but we take reasonable steps to protect your information and will notify you of a breach that
          affects you where we are required to.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          {SITE_NAME} is not intended for anyone under 18. We do not knowingly collect information from
          minors.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update this policy; the &quot;last updated&quot; date shows when it last changed.
          Material changes will be highlighted on the site.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Privacy questions or requests:{" "}
          <a href={CONTACT.email.href} className="text-brand-hover dark:text-brand-light underline">
            {CONTACT.email.address}
          </a>
          .
        </p>
      </Section>
    </LegalPageShell>
  );
}
