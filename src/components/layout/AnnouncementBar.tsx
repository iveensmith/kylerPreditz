import Link from "next/link";
import { getSiteContent } from "@/lib/site-content";

/** Admin-controlled slim banner above the header (Admin > Header & Footer). Renders nothing when off. */
export async function AnnouncementBar() {
  const c = await getSiteContent();
  if (!c.announcementEnabled || !c.announcementText) return null;

  const link =
    c.announcementLinkHref &&
    (c.announcementLinkHref.startsWith("/") ? (
      <Link href={c.announcementLinkHref} className="ml-2 font-semibold underline underline-offset-2">
        {c.announcementLinkLabel || "Learn more"}
      </Link>
    ) : (
      <a href={c.announcementLinkHref} target="_blank" rel="noopener noreferrer" className="ml-2 font-semibold underline underline-offset-2">
        {c.announcementLinkLabel || "Learn more"}
      </a>
    ));

  return (
    <div className="bg-brand px-4 py-2 text-center text-[13px] leading-snug text-white">
      {c.announcementText}
      {link}
    </div>
  );
}
