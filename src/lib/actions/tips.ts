"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PremiumMode, type PredictionMarket } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { MARKETS } from "@/lib/predictions/model";

function parseTipFields(formData: FormData) {
  const market = formData.get("market") as string;
  const selection = String(formData.get("selection") ?? "").trim();
  const odds = Number(formData.get("odds"));
  const confidence = Number(formData.get("confidence"));
  const reasoning = String(formData.get("reasoning") ?? "").trim();

  if (!(MARKETS as readonly string[]).includes(market)) throw new Error(`Invalid market: ${market}`);
  if (!selection) throw new Error("Selection is required");
  if (!Number.isFinite(odds) || odds <= 0) throw new Error("Odds must be a positive number");
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) throw new Error("Confidence must be 0-100");
  if (!reasoning) throw new Error("Reasoning is required");

  return { market: market as PredictionMarket, selection, odds, confidence, reasoning };
}

export async function updateTip(id: string, formData: FormData) {
  await requireAdmin();
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

export async function createManualTip(formData: FormData) {
  await requireAdmin();
  const fixtureId = String(formData.get("fixtureId") ?? "");
  if (!fixtureId) throw new Error("A fixture must be selected");
  const fields = parseTipFields(formData);

  await prisma.prediction.create({
    data: { fixtureId, ...fields, isManualOverride: true },
  });

  revalidatePath("/admin/tips");
  revalidatePath("/");
  redirect("/admin/tips");
}
