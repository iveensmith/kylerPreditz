import { getAllPartnersForAdmin } from "@/lib/partners";
import { createPartner, updatePartner } from "@/lib/actions/partners";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DeletePartnerButton } from "@/components/admin/DeletePartnerButton";
import { EMPTY_PARTNER, PartnerFields } from "@/components/admin/PartnerFields";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const partners = await getAllPartnersForAdmin();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <AdminHeader eyebrow="Site" title="Partners" />
      <p className="text-sm text-muted">
        Sponsors and partner sites shown in a strip at the top of the footer on every public page. Only partners marked
        &quot;Show in the footer&quot; appear. If none are active, the strip is hidden.
      </p>

      <section className="rounded-[var(--radius-card)] border border-line p-4">
        <h2 className="mb-3 text-sm font-semibold">Add a partner</h2>
        <ActionForm action={createPartner} submitLabel="Add partner" resetOnSuccess className="flex flex-col gap-3">
          <PartnerFields p={EMPTY_PARTNER} />
        </ActionForm>
      </section>

      <section className="flex flex-col gap-2">
        <div className="eyebrow">{partners.length} partner{partners.length === 1 ? "" : "s"}</div>
        {partners.length === 0 ? (
          <p className="text-sm text-muted">No partners yet.</p>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
            {partners.map((p) => (
              <details key={p.id} className="border-b border-line last:border-b-0">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 truncate font-mono text-[11px] text-faint">{p.url}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-semibold uppercase">
                    <span className="text-faint">#{p.sortOrder}</span>
                    {p.sponsored && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">Sponsored</span>}
                    <span className={`rounded px-1.5 py-0.5 ${p.active ? "bg-win/12 text-win" : "bg-surface-2 text-muted"}`}>
                      {p.active ? "Shown" : "Hidden"}
                    </span>
                  </span>
                </summary>
                <div className="border-t border-line bg-surface-2 px-4 py-4">
                  <ActionForm action={updatePartner.bind(null, p.id)} submitLabel="Save" className="flex flex-col gap-3">
                    <PartnerFields p={p} />
                  </ActionForm>
                  <div className="mt-3 flex justify-end">
                    <DeletePartnerButton id={p.id} name={p.name} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
