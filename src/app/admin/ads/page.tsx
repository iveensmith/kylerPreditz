import { getAdsSettings } from "@/lib/ads.server";
import { absoluteUrl } from "@/lib/seo";
import { adminInput, adminLabel, adminLabelText } from "@/lib/admin-ui";
import { saveAdsSettings } from "@/lib/actions/ads";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

async function fetchAdsTxt(): Promise<string | null> {
  try {
    const res = await fetch(absoluteUrl("/ads.txt"), { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return res.ok ? (await res.text()).trim() : null;
  } catch {
    return null;
  }
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={`mt-0.5 font-mono text-xs font-bold ${ok ? "text-win" : "text-loss"}`}>{ok ? "OK" : "NO"}</span>
      <span>
        {label}
        {detail && <span className="block break-all font-mono text-[11px] text-faint">{detail}</span>}
      </span>
    </li>
  );
}

export default async function AdminAdsPage() {
  const ads = await getAdsSettings();
  const adsTxt = ads.clientId ? await fetchAdsTxt() : null;
  const expectedLine = ads.clientId ? `google.com, ${ads.clientId.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0` : null;

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <AdminHeader eyebrow="Monetisation" title="Ads (Google AdSense)" />

      <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line p-4">
        <h2 className="text-sm font-semibold">Status</h2>
        <ul className="flex flex-col gap-2.5">
          <Check
            ok={Boolean(ads.clientId)}
            label={ads.clientId ? `Publisher ID set (${ads.source === "admin" ? "from this page" : "from the environment variable"})` : "No publisher ID configured"}
            detail={ads.clientId ?? undefined}
          />
          <Check ok={ads.enabled && Boolean(ads.clientId)} label="AdSense script loads on public pages" detail={ads.enabled ? undefined : "Switched off below"} />
          <Check
            ok={Boolean(expectedLine && adsTxt?.includes(expectedLine))}
            label="ads.txt is published and lists your publisher ID"
            detail={adsTxt ? adsTxt : ads.clientId ? "Could not read /ads.txt from the live site" : undefined}
          />
        </ul>
        <p className="text-xs text-muted">
          Google needs the script, the <code>google-adsense-account</code> meta tag and ads.txt to approve the site. The
          meta tag and ads.txt stay live even if you switch the script off.
        </p>
      </section>

      <ActionForm action={saveAdsSettings} submitLabel="Save ad settings" className="flex flex-col gap-4">
        <label className={adminLabel}>
          <span className={adminLabelText}>AdSense publisher ID</span>
          <input
            name="clientId"
            defaultValue={ads.source === "admin" ? (ads.clientId ?? "") : ""}
            placeholder={ads.source === "env" ? `${ads.clientId} (from environment)` : "ca-pub-1234567890123456"}
            className={adminInput}
          />
          <span className="text-[11px] text-faint">Leave blank to use the environment variable value.</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={ads.enabled} />
          Show ads: load the AdSense script on public pages
        </label>
      </ActionForm>
    </div>
  );
}
