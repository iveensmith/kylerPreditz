import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncResults } from "@/lib/jobs/sync-results";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncResults();

  // No on-demand revalidatePath here on purpose: the homepage, prediction, and
  // league pages already time-revalidate every 120s/900s, which is fast enough
  // given this cron itself only runs every 3 min. On-demand revalidation on every
  // transition was forcing an extra rebuild on top of that timer and was the
  // main driver behind exceeding the Vercel Hobby ISR Writes quota (200k/month).

  return NextResponse.json(result);
}
