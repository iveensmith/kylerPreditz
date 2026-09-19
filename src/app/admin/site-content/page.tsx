import { getSiteContent, LIMITS } from "@/lib/site-content";
import { saveSiteContentAction } from "@/lib/actions/site-content";
import { adminInput, adminLabel, adminLabelText } from "@/lib/admin-ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminSiteContentPage() {
  const c = await getSiteContent();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <AdminHeader eyebrow="Site" title="Header & footer content" />
      <p className="text-sm text-muted">
        Plain text only. Leave the footer fields blank to keep the built-in wording. Changes go live on every public
        page as soon as you save.
      </p>

      <ActionForm action={saveSiteContentAction} submitLabel="Save content" className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-4">
          <legend className="px-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-faint">
            Announcement bar (above the header)
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="announcementEnabled" defaultChecked={c.announcementEnabled} />
            Show the announcement bar
          </label>
          <label className={adminLabel}>
            <span className={adminLabelText}>Message (up to {LIMITS.announcementText} characters)</span>
            <input name="announcementText" defaultValue={c.announcementText} maxLength={LIMITS.announcementText} className={adminInput} placeholder="e.g. Weekend accumulators are now live" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={adminLabel}>
              <span className={adminLabelText}>Link label (optional)</span>
              <input name="announcementLinkLabel" defaultValue={c.announcementLinkLabel} maxLength={LIMITS.linkLabel} className={adminInput} placeholder="See picks" />
            </label>
            <label className={adminLabel}>
              <span className={adminLabelText}>Link (optional)</span>
              <input name="announcementLinkHref" defaultValue={c.announcementLinkHref} className={adminInput} placeholder="/vip or https://..." />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-4">
          <legend className="px-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-faint">Footer</legend>
          <label className={adminLabel}>
            <span className={adminLabelText}>Text under the logo (up to {LIMITS.footerBlurb})</span>
            <textarea name="footerBlurb" defaultValue={c.footerBlurb} maxLength={LIMITS.footerBlurb} rows={3} className={adminInput} placeholder="Built-in text is used when blank" />
          </label>
          <label className={adminLabel}>
            <span className={adminLabelText}>Risk disclaimer (up to {LIMITS.footerDisclaimer})</span>
            <textarea name="footerDisclaimer" defaultValue={c.footerDisclaimer} maxLength={LIMITS.footerDisclaimer} rows={4} className={adminInput} placeholder="Built-in text is used when blank" />
          </label>
          <label className={adminLabel}>
            <span className={adminLabelText}>Extra footer links (one per line, max {LIMITS.extraLinks})</span>
            <textarea
              name="extraFooterLinks"
              defaultValue={c.extraFooterLinks.map((l) => `${l.label} | ${l.href}`).join("\n")}
              rows={4}
              className={`${adminInput} font-mono text-xs`}
              placeholder={"Contact | /about\nPartner with us | https://example.com"}
            />
            <span className="text-[11px] text-faint">Format: Label | link. Added to the &quot;Quick Links&quot; column.</span>
          </label>
        </fieldset>
      </ActionForm>
    </div>
  );
}
