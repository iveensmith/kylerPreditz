import Link from "next/link";
import { CONTACT } from "@/lib/contact.config";
import { ScoreMatrix } from "./ScoreMatrix";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#07120D] text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 80% at 12% 0%, rgba(18,165,92,0.16), transparent 60%), linear-gradient(180deg, #081912 0%, #07120D 55%, #0A0E0C 100%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14">
        <div>
          <span className="eyebrow !text-brand-light">The model, in the open</span>
          <h1 className="mt-4 text-[2.5rem] leading-[0.98] sm:text-6xl">
            Football predictions built on a{" "}
            <span className="text-brand-light">statistical model</span>, not guesswork.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
            Every fixture runs through a Poisson model with a Dixon&ndash;Coles adjustment,
            built from each team&rsquo;s recent scoring and defensive form &mdash; home and away
            weighted separately. Confidence is capped at 92%, and every tip stays in a public
            archive, win or lose.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/vip"
              className="inline-flex items-center rounded-[var(--radius-control)] bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Go Premium
            </Link>
            <a
              href={CONTACT.telegramChannel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-brand-light/40 px-5 py-3 text-sm font-semibold text-brand-light transition-colors hover:border-brand-light hover:bg-brand-light/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
                <path d="M21.94 4.6l-3.02 14.26c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73L18.7 6.3c.37-.33-.08-.51-.58-.18L6.66 13.4l-4.66-1.46c-1.01-.32-1.03-1.01.21-1.5l18.22-7.02c.84-.31 1.58.2 1.31 1.47z" />
              </svg>
              Telegram Tips
            </a>
          </div>
        </div>

        <ScoreMatrix className="justify-self-start lg:justify-self-end" />
      </div>
    </section>
  );
}
