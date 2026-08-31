import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncTeamStats } from "@/lib/jobs/sync-stats";

export const maxDuration = 60;

// Per-team TeamStats - the stage-1 model's inputs. Stalest-first and time-boxed,
// so it needs several runs to cover all leagues; delay-tolerant, so it lives on
// GitHub Actions rather than the 30s-timeout scheduler.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncTeamStats();
  return NextResponse.json(result);
}
