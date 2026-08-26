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
    <main className="max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <JsonLd data={buildFaqPageJsonLd(faq)} />
      <div>
        <h1 className="text-xl font-semibold mb-2">{config.h1}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{config.intro}</p>
      </div>

      {config.filter.type === "banker" ? (
        banker ? (
          <BankerCard banker={banker} />
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No upcoming picks yet.</p>
        )
      ) : leagues.length > 0 ? (
        <div className="flex flex-col gap-4">
          {leagues.map((league) => (
            <LeagueTipGroup key={league.id} league={league} />
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">No matching tips in the next 7 days yet.</p>
      )}

      <section className="text-sm text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p>
          All predictions are statistical estimates from our own model, capped at 92% confidence. They are not
          guaranteed outcomes - see our public{" "}
          <Link href="/results" className="underline hover:text-zinc-700 dark:hover:text-zinc-200">
            results archive
          </Link>{" "}
          for every published tip, win or lose.
        </p>
      </section>

      <FaqSection entries={faq} />
    </main>
  );
}
