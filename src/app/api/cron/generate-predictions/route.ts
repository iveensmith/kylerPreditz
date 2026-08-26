import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { generatePredictions } from "@/lib/jobs/generate-predictions";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generatePredictions();
  return NextResponse.json(result);
}
