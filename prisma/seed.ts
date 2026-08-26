import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "../src/lib/db/prisma";
import { apiLeagueLogoUrl, TRACKED_LEAGUES } from "../src/lib/leagues.config";
import { getLeagueById } from "../src/lib/api-football/endpoints";

async function main() {
  const hasApiKey = Boolean(process.env.API_FOOTBALL_KEY);

  for (const league of TRACKED_LEAGUES) {
    let name: string = league.name;
    let country: string = league.country;
    let logoUrl: string = apiLeagueLogoUrl(league.apiId);

    if (hasApiKey) {
      try {
        const apiLeague = await getLeagueById(league.apiId);
        if (apiLeague) {
          name = apiLeague.league.name;
          country = apiLeague.country.name;
          logoUrl = apiLeague.league.logo;
        }
      } catch (err) {
        console.warn(`[seed] could not enrich league ${league.name} from API-Football:`, err);
      }
    }

    await prisma.league.upsert({
      where: { apiId: league.apiId },
      create: {
        apiId: league.apiId,
        name,
        country,
        slug: league.slug,
        logoUrl,
        isFeatured: true,
        priority: league.priority,
      },
      update: {
        name,
        country,
        logoUrl,
        isFeatured: true,
        priority: league.priority,
      },
    });
    console.log(`[seed] upserted league: ${name} (${country})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
