import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncResults } from "@/lib/jobs/sync-results";

export const maxDuration = 60;

// Public pages that render a fixture's live/final state. When a fixture changes
// status we revalidate these immediately rather than waiting out their ISR window.
const FIXTURE_FACING_PATHS: Array<[string, "page"]> = [
  ["/", "page"],
  ["/predictions/[id]/[slug]", "page"],
  ["/leagues/[country]/[league]", "page"],
];

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncResults();

  if (result.fixturesTransitioned > 0) {
    for (const [path, type] of FIXTURE_FACING_PATHS) {
      revalidatePath(path, type);
    }
  }

  return NextResponse.json(result);
}
