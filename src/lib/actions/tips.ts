"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PremiumMode, type PredictionMarket } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { MARKETS } from "@/lib/predictions/model";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/actions/result";

function parseTipFields(formData: FormData) {
  const market = formData.get("market") as string;
  const selection = String(formData.get("selection") ?? "").trim();
  const odds = Number(formData.get("odds"));
  const confidence = Number(formData.get("confidence"));
  const reasoning = String(formData.get("reasoning") ?? "").trim();

  if (!(MARKETS as readonly string[]).includes(market)) throw new UserFacingError(`Invalid market: ${market}`);
  if (!selection) throw new UserFacingError("Selection is required");
  if (!Number.isFinite(odds) || odds <= 0) throw new UserFacingError("Odds must be a positive number");
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) throw new UserFacingError("Confidence must be 0-100");
  if (!reasoning) throw new UserFacingError("Reasoning is required");

  return { market: market as PredictionMarket, selection, odds, confidence, reasoning };
}

export async function updateTip(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
  const fields = parseTipFields(formData);

  const premiumRaw = String(formData.get("premium") ?? PremiumMode.AUTO);
  const premium = (Object.values(PremiumMode) as string[]).includes(premiumRaw)
    ? (premiumRaw as PremiumMode)
    : PremiumMode.AUTO;

  await prisma.prediction.update({
    where: { id },
    data: {
      ...fields,
      premium,
      isBanker: formData.get("isBanker") === "on",
      isManualOverride: true,
    },
  });
  } catch (e) {
    return toActionError(e);
  }

  revalidatePath("/admin/tips");
  revalidatePath("/");
  redirect("/admin/tips");
}

export async function deleteTip(id: string) {
  await requireAdmin();
  await prisma.prediction.delete({ where: { id } });
  revalidatePath("/admin/tips");
  revalidatePath("/");
}

export async function createManualTip(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
  const fixtureId = String(formData.get("fixtureId") ?? "");
  if (!fixtureId) throw new UserFacingError("A fixture must be selected");
  const fields = parseTipFields(formData);

  await prisma.prediction.create({
    data: { fixtureId, ...fields, isManualOverride: true },
  });
  } catch (e) {
    return toActionError(e, "Could not create the tip - it may already have one.");
  }

  revalidatePath("/admin/tips");
  revalidatePath("/");
  redirect("/admin/tips");
}
