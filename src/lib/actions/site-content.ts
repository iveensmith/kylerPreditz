"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { assertNoBannedPhrases } from "@/lib/content-rules";
import { isSafeHref, LIMITS, saveSiteContent, type FooterLink } from "@/lib/site-content";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/actions/result";

function text(formData: FormData, name: string, max: number, label: string): string {
  const v = String(formData.get(name) ?? "").trim();
  if (v.length > max) throw new UserFacingError(`${label} is ${v.length} characters - the limit is ${max}.`);
  return v;
}

function checkHref(href: string, label: string) {
  if (href && !isSafeHref(href)) {
    throw new UserFacingError(`${label} must start with "/" (a page on this site) or "https://".`);
  }
}

/** Parses "Label | /path-or-https-url" lines into footer links. */
function parseLinks(raw: string): FooterLink[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > LIMITS.extraLinks) throw new UserFacingError(`At most ${LIMITS.extraLinks} extra footer links.`);
  return lines.map((line, i) => {
    const [label, ...rest] = line.split("|");
    const href = rest.join("|").trim();
    const l = (label ?? "").trim();
    if (!l || !href) throw new UserFacingError(`Footer link ${i + 1}: write it as "Label | https://example.com".`);
    if (l.length > LIMITS.linkLabel) throw new UserFacingError(`Footer link ${i + 1}: label is over ${LIMITS.linkLabel} characters.`);
    checkHref(href, `Footer link ${i + 1}`);
    return { label: l, href };
  });
}

/** Saves the header announcement bar and footer text/links (Admin > Header & Footer). Plain text only. */
export async function saveSiteContentAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const announcementText = text(formData, "announcementText", LIMITS.announcementText, "Announcement");
    const announcementLinkLabel = text(formData, "announcementLinkLabel", LIMITS.linkLabel, "Announcement link label");
    const announcementLinkHref = text(formData, "announcementLinkHref", 500, "Announcement link");
    checkHref(announcementLinkHref, "Announcement link");
    const footerBlurb = text(formData, "footerBlurb", LIMITS.footerBlurb, "Footer text");
    const footerDisclaimer = text(formData, "footerDisclaimer", LIMITS.footerDisclaimer, "Footer disclaimer");
    const extraFooterLinks = parseLinks(String(formData.get("extraFooterLinks") ?? ""));
    const announcementEnabled = formData.get("announcementEnabled") === "on";

    if (announcementEnabled && !announcementText) {
      throw new UserFacingError("Write the announcement text, or untick 'Show the announcement bar'.");
    }
    assertNoBannedPhrases(announcementText, announcementLinkLabel, footerBlurb, footerDisclaimer, ...extraFooterLinks.map((l) => l.label));

    await saveSiteContent({
      announcementEnabled,
      announcementText,
      announcementLinkLabel,
      announcementLinkHref,
      footerBlurb,
      footerDisclaimer,
      extraFooterLinks,
    });
    revalidatePath("/", "layout");
    revalidatePath("/admin/site-content");
    return { ok: "Saved. Live on every public page." };
  } catch (e) {
    return toActionError(e);
  }
}
