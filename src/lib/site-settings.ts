import { prisma } from "@/lib/db/prisma";

const GAMES_TODAY_KEY = "gamesToday";

/**
 * Admin "Are there games today?" switch. Defaults to true (no row = normal site);
 * only an explicit "no" turns the homepage's today view into a no-matches notice.
 */
export async function getGamesToday(): Promise<boolean> {
  const row = await prisma.siteSetting.findUnique({ where: { key: GAMES_TODAY_KEY } });
  return row?.value !== "no";
}

export async function setGamesToday(value: boolean): Promise<void> {
  const v = value ? "yes" : "no";
  await prisma.siteSetting.upsert({
    where: { key: GAMES_TODAY_KEY },
    create: { key: GAMES_TODAY_KEY, value: v },
    update: { value: v },
  });
}
