"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { setGamesToday } from "@/lib/site-settings";
import { toActionError, type ActionResult } from "@/lib/actions/result";

/**
 * "Refresh system": drops every cached public page (homepage, prediction days,
 * match pages, blog, results, sitemap) so the next visit re-renders from the
 * database. Use after editing tips/posts or when a page looks stale. Does not
 * call API-Football, so it costs no quota.
 */
export async function refreshSystem(): Promise<ActionResult> {
  await requireAdmin();
  try {
    revalidatePath("/", "layout");
    return { ok: `Caches cleared at ${new Date().toISOString().slice(11, 19)} UTC - public pages rebuild on next visit.` };
  } catch (e) {
    return toActionError(e, "Could not clear caches.");
  }
}

/** Admin switch for "are there games today?" - "no" swaps the homepage's today view for a notice. */
export async function updateGamesToday(hasGames: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await setGamesToday(hasGames);
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: hasGames ? "Homepage is showing today's matches." : "Homepage now shows a no-matches notice for today." };
  } catch (e) {
    return toActionError(e, "Could not save that setting.");
  }
}
