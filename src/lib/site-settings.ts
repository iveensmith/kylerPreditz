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

/** Generic string setting; null when unset. */
export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

/** Sets a setting, or clears it (falls back to defaults) when value is null. */
export async function setSetting(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await prisma.siteSetting.deleteMany({ where: { key } });
    return;
  }
  await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
}
