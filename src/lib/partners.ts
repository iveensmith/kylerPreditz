import { prisma } from "@/lib/db/prisma";

/** Active partners in display order for the public footer. Never throws - the footer must render regardless. */
export async function getActivePartners() {
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
}

export async function getAllPartnersForAdmin() {
  return prisma.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}
