"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function toggleLeagueFeatured(leagueId: string, isFeatured: boolean) {
  await requireAdmin();
  await prisma.league.update({ where: { id: leagueId }, data: { isFeatured } });
  revalidatePath("/admin/leagues");
  revalidatePath("/");
  revalidatePath("/leagues");
}
