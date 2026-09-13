import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncLeagueTables } from "@/lib/jobs/sync-stats";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncLeagueTables();

  // No on-demand revalidatePath here on purpose: league pages already
  // time-revalidate every 900s, which is fine for standings. On-demand
  // revalidation on every change was extra ISR writes on top of that timer -
  // see the matching note in sync-results/route.ts.

  return NextResponse.json(result);
}
