import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MARKET_PAGES, getMarketPageConfig } from "@/lib/markets.config";
import { getBankerPagePick, getFixturesForMarketFilter } from "@/lib/queries/markets";
import { generateMarketFaq } from "@/lib/faq.config";
import { buildFaqPageJsonLd } from "@/lib/structured-data";
import { absoluteUrl } from "@/lib/seo";
import { LeagueTipGroup } from "@/components/home/LeagueTipGroup";
import { BankerCard } from "@/components/home/BankerCard";
import { FaqSection } from "@/components/home/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 900;

export async function generateStaticParams() {
  return MARKET_PAGES.map((m) => ({ market: m.slug }));
}

type Props = { params: Promise<{ market: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market } = await params;
  const config = getMarketPageConfig(market);
  if (!config) return {};
  const url = absoluteUrl(`/${config.slug}`);
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: config.metaTitle, description: config.metaDescription, url },
  };
}

export default async function MarketPage({ params }: Props) {
  const { market } = await params;
  const config = getMarketPageConfig(market);
  if (!config) notFound();

  const banker = config.filter.type === "banker" ? await getBankerPagePick() : null;
  const leagues = config.filter.type === "banker" ? [] : await getFixturesForMarketFilter(config.filter);

  const faq = generateMarketFaq(config);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <JsonLd data={buildFaqPageJsonLd(faq)} />
      <header className="border-b border-line pb-5">
        <div className="eyebrow mb-2">Market</div>
        <h1 className="text-[2rem] leading-[1.05] sm:text-4xl">{config.h1}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{config.intro}</p>
      </header>

      {config.filter.type === "banker" ? (
        banker ? (
          <BankerCard banker={banker} />
        ) : (
          <p className="text-muted text-sm">No upcoming picks yet.</p>
        )
      ) : leagues.length > 0 ? (
        <div className="flex flex-col gap-4">
          {leagues.map((league) => (
            <LeagueTipGroup key={league.id} league={league} />
          ))}
        </div>
      ) : (
        <p className="text-muted text-sm">No matching tips in the next 7 days yet.</p>
      )}

      <section className="text-sm text-muted pt-4 border-t border-line">
        <p>
          All predictions are statistical estimates from our own model, capped at 92% confidence. They are not
          guaranteed outcomes - see our public{" "}
          <Link href="/results" className="underline hover:text-ink">
            results archive
          </Link>{" "}
          for every published tip, win or lose.
        </p>
      </section>

      <FaqSection entries={faq} />
    </main>
  );
}
