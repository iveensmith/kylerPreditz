import Link from "next/link";
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
              href="#todays-tips"
              className="inline-flex items-center rounded-[var(--radius-control)] bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              See today&rsquo;s tips
            </Link>
            <Link
              href="/results"
              className="inline-flex items-center rounded-[var(--radius-control)] border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition-colors hover:border-white/35 hover:text-white"
            >
              Check the results archive
            </Link>
          </div>
        </div>

        <ScoreMatrix className="justify-self-start lg:justify-self-end" />
      </div>
    </section>
  );
}
