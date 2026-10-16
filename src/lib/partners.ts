import { cache } from "react";
import { prisma } from "@/lib/db/prisma";

/**
 * Active partners in display order for the public footer. Never throws - the footer must
 * render regardless. cache()'d per request - each Prisma call opens its own connection under
 * Workers' `maxUses: 1` (see src/lib/db/prisma.ts), so this is one less avoidable round-trip
 * even though only one component currently calls it.
 */
export const getActivePartners = cache(async () => {
  try {
    return await prisma.partner.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 24,
    });
  } catch (e) {
    console.error("[partners] read failed", e);
    return [];
  }
});

export async function getAllPartnersForAdmin() {
  return prisma.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}
