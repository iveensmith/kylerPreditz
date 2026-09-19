"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { assertNoBannedPhrases } from "@/lib/content-rules";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/page-seo";
import { SEO_PAGE_PATHS } from "@/lib/seo-pages.config";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/actions/result";

/** Saves a page's title/description override. Both fields blank = remove the override (back to the built-in text). */
export async function savePageSeo(path: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    if (!SEO_PAGE_PATHS.has(path)) throw new UserFacingError("Unknown page.");
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (title.length > TITLE_MAX) throw new UserFacingError(`Title is ${title.length} characters - keep it under ${TITLE_MAX} so Google doesn't cut it off.`);
    if (description.length > DESCRIPTION_MAX) throw new UserFacingError(`Description is ${description.length} characters - keep it under ${DESCRIPTION_MAX}.`);
    assertNoBannedPhrases(title, description);

    if (!title && !description) {
      await prisma.pageSeo.deleteMany({ where: { path } });
    } else {
      await prisma.pageSeo.upsert({
        where: { path },
        create: { path, title: title || null, description: description || null },
        update: { title: title || null, description: description || null },
      });
    }
    revalidatePath(path);
    revalidatePath("/admin/seo");
    return { ok: !title && !description ? "Override removed - the page uses its default title and description again." : "Saved. Live on the page now." };
  } catch (e) {
    return toActionError(e);
  }
}
