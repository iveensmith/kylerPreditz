import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncLeagueTables } from "@/lib/jobs/sync-stats";

export const maxDuration = 60;

// Pages that render standings / top scorers. syncLeagueTables has no ISR window
// of its own, so without this a refreshed table only shows once the page's own
// revalidate timer (15 min on league detail) next elapses.
const STATS_FACING_PATHS: Array<[string, "page"]> = [
  ["/", "page"],
  ["/leagues", "page"],
  ["/leagues/[country]/[league]", "page"],
];

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncLeagueTables();

  if (result.standingsWritten > 0 || result.topScorersWritten > 0 || result.staleRowsPruned > 0) {
    for (const [path, type] of STATS_FACING_PATHS) {
      revalidatePath(path, type);
    }
  }

  return NextResponse.json(result);
}
