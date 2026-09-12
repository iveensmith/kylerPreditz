import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncLeagueTables } from "@/lib/jobs/sync-stats";
import { slugify } from "@/lib/slugs";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncLeagueTables();

  // Revalidate only the specific leagues that actually changed, not every league
  // page site-wide - see the note on LeagueTablesResult.changedLeagues.
  if (result.changedLeagues.length > 0) {
    revalidatePath("/", "page");
    revalidatePath("/leagues", "page");
    for (const league of result.changedLeagues) {
      revalidatePath(`/leagues/${slugify(league.country)}/${league.slug}`, "page");
    }
  }

  return NextResponse.json(result);
}
