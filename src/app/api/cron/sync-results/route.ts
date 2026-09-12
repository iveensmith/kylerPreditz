import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncResults } from "@/lib/jobs/sync-results";
import { matchSlug } from "@/lib/queries/match-detail";
import { slugify } from "@/lib/slugs";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncResults();

  // Revalidate only the specific fixtures/leagues that actually transitioned this
  // run, not every prediction/league page site-wide - see the note on
  // SyncResultsResult.transitioned. Previously this used revalidatePath with the
  // bracketed route pattern (e.g. "/predictions/[id]/[slug]"), which regenerates
  // every page matching that pattern - the main driver behind the ISR write spike.
  if (result.transitioned.length > 0) {
    revalidatePath("/", "page");
    const seenLeagues = new Set<string>();
    for (const f of result.transitioned) {
      const slug = matchSlug(f.homeTeamName, f.awayTeamName);
      revalidatePath(`/predictions/${f.fixtureId}/${slug}`, "page");

      const leaguePath = `/leagues/${slugify(f.leagueCountry)}/${f.leagueSlug}`;
      if (!seenLeagues.has(leaguePath)) {
        seenLeagues.add(leaguePath);
        revalidatePath(leaguePath, "page");
      }
    }
  }

  return NextResponse.json(result);
}
