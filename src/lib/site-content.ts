import { getSetting, setSetting } from "@/lib/site-settings";

const KEY = "siteContent";

export type FooterLink = { label: string; href: string };

export type SiteContent = {
  /** Slim banner above the header on every public page. */
  announcementEnabled: boolean;
  announcementText: string;
  announcementLinkLabel: string;
  announcementLinkHref: string;
  /** Footer paragraph under the logo; blank = the built-in text. */
  footerBlurb: string;
  /** Risk / disclaimer paragraph at the bottom of the footer; blank = the built-in text. */
  footerDisclaimer: string;
  /** Extra links appended to the footer's "Quick Links" column. */
  extraFooterLinks: FooterLink[];
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  announcementEnabled: false,
  announcementText: "",
  announcementLinkLabel: "",
  announcementLinkHref: "",
  footerBlurb: "",
  footerDisclaimer: "",
  extraFooterLinks: [],
};

export const LIMITS = {
  announcementText: 160,
  linkLabel: 40,
  footerBlurb: 300,
  footerDisclaimer: 500,
  extraLinks: 8,
} as const;

/** Internal path ("/about") or http(s) URL. Rejects javascript:, data:, protocol-relative, etc. */
export function isSafeHref(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/** Reads admin-set header/footer content. Never throws: public pages must render even if the DB read fails. */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const raw = await getSetting(KEY);
    if (!raw) return DEFAULT_SITE_CONTENT;
    const p = JSON.parse(raw) as Record<string, unknown>;
    const links = Array.isArray(p.extraFooterLinks) ? p.extraFooterLinks : [];
    return {
      announcementEnabled: p.announcementEnabled === true,
      announcementText: str(p.announcementText, LIMITS.announcementText),
      announcementLinkLabel: str(p.announcementLinkLabel, LIMITS.linkLabel),
      announcementLinkHref: isSafeHref(str(p.announcementLinkHref, 500)) ? str(p.announcementLinkHref, 500) : "",
      footerBlurb: str(p.footerBlurb, LIMITS.footerBlurb),
      footerDisclaimer: str(p.footerDisclaimer, LIMITS.footerDisclaimer),
      extraFooterLinks: links
        .map((l): FooterLink => ({
          label: str((l as FooterLink)?.label, LIMITS.linkLabel),
          href: str((l as FooterLink)?.href, 500),
        }))
        .filter((l) => l.label && isSafeHref(l.href))
        .slice(0, LIMITS.extraLinks),
    };
  } catch (e) {
    console.error("[site-content] read failed, using defaults", e);
    return DEFAULT_SITE_CONTENT;
  }
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  await setSetting(KEY, JSON.stringify(content));
}
