import { NextResponse } from "next/server";
import { getRevealablePicks } from "@/lib/premium";

// Members' browsers hit this to unlock the premium picks that the static pages
// render as locked. Non-members / logged-out get {}.
export const dynamic = "force-dynamic";

export async function GET() {
  const picks = await getRevealablePicks();
  return NextResponse.json(picks, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
