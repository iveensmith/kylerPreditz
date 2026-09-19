"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { assertNoBannedPhrases } from "@/lib/content-rules";
import { isSafeHref } from "@/lib/site-content";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/actions/result";

function parsePartner(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const sortRaw = String(formData.get("sortOrder") ?? "0").trim();
  const sortOrder = Number(sortRaw === "" ? 0 : sortRaw);

  if (!name) throw new UserFacingError("Name is required.");
  if (name.length > 60) throw new UserFacingError("Name is over 60 characters.");
  if (!/^https?:\/\//i.test(url) || !isSafeHref(url)) throw new UserFacingError("Website must be a full link starting with https://");
  if (logoUrl && !/^https:\/\//i.test(logoUrl)) throw new UserFacingError("Logo must be an image link starting with https://");
  if (description && description.length > 140) throw new UserFacingError("Description is over 140 characters.");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) throw new UserFacingError("Order must be a whole number from 0 to 9999.");
  assertNoBannedPhrases(name, description);

  return {
    name,
    url,
    logoUrl,
    description,
    sortOrder,
    active: formData.get("active") === "on",
    sponsored: formData.get("sponsored") === "on",
  };
}

function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/partners");
}

export async function createPartner(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.partner.create({ data: parsePartner(formData) });
    refresh();
    return { ok: "Partner added." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updatePartner(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.partner.update({ where: { id }, data: parsePartner(formData) });
    refresh();
    return { ok: "Saved." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deletePartner(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.partner.delete({ where: { id } });
    refresh();
  } catch (e) {
    return toActionError(e, "Could not delete this partner.");
  }
}
