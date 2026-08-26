import { NextRequest } from "next/server";

/** Vercel Cron (and manual triggers) authenticate with `Authorization: Bearer $CRON_SECRET`. */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
