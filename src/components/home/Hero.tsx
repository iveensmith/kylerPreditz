import Image from "next/image";

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-zinc-950 text-white">
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[55%]">
        <Image
          src="/hero-player.jpg"
          alt="Silhouette of a football player heading the ball at sunset"
          fill
          priority
          sizes="55vw"
          className="object-cover"
          style={{ objectPosition: "50% 12%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent" />
      </div>

      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle at 15% 20%, rgba(22,163,74,0.35), transparent 45%), radial-gradient(circle at 85% 0%, rgba(220,38,38,0.2), transparent 40%)",
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-20">
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight max-w-2xl">
          Football Predictions Built on a <span className="text-brand-light">Statistical Model</span>, Not Guesswork
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-300">
          Every fixture is run through a Poisson model with a Dixon-Coles adjustment, built from each team&apos;s
          recent scoring and defensive form - home and away weighted separately. One probability matrix per match
          drives every market we publish, confidence is capped at 92%, and every tip stays in a public archive
          afterwards, win or lose.
        </p>
        <a
          href="#todays-tips"
          className="inline-flex items-center gap-2 mt-6 rounded-full bg-brand hover:bg-brand-hover transition-colors text-white px-6 py-3 font-medium"
        >
          See Today&apos;s Tips
        </a>
      </div>
    </div>
  );
}
