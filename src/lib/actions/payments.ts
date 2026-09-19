"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { MAX_PRICE_NAIRA, MIN_PRICE_NAIRA, savePlanPrices } from "@/lib/plans.server";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/actions/result";

/** Saves the three plan prices (whole naira). Takes effect for new checkouts immediately. */
export async function updatePlanPrices(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const read = (name: string, label: string) => {
      const n = Number(String(formData.get(name) ?? "").replace(/[,\s]/g, ""));
      if (!Number.isInteger(n) || n < MIN_PRICE_NAIRA || n > MAX_PRICE_NAIRA) {
        throw new UserFacingError(
          `${label} price must be a whole number of naira between ${MIN_PRICE_NAIRA.toLocaleString("en-NG")} and ${MAX_PRICE_NAIRA.toLocaleString("en-NG")}.`,
        );
      }
      return n;
    };
    await savePlanPrices({
      WEEKLY: read("WEEKLY", "Weekly"),
      MONTHLY: read("MONTHLY", "Monthly"),
      LIFETIME: read("LIFETIME", "Lifetime"),
    });
    revalidatePath("/vip");
    revalidatePath("/admin/payments");
    return { ok: "Prices saved. New checkouts use them straight away." };
  } catch (e) {
    return toActionError(e);
  }
}
