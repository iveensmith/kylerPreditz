import { adminInput, adminLabel, adminLabelText } from "@/lib/admin-ui";

export type PartnerDefaults = {
  name: string;
  url: string;
  logoUrl: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  sponsored: boolean;
};

export const EMPTY_PARTNER: PartnerDefaults = {
  name: "",
  url: "",
  logoUrl: null,
  description: null,
  sortOrder: 0,
  active: true,
  sponsored: true,
};

/** Shared field set for adding and editing a partner. */
export function PartnerFields({ p }: { p: PartnerDefaults }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={adminLabel}>
          <span className={adminLabelText}>Name</span>
          <input name="name" defaultValue={p.name} required maxLength={60} className={adminInput} />
        </label>
        <label className={adminLabel}>
          <span className={adminLabelText}>Website</span>
          <input name="url" type="url" defaultValue={p.url} required placeholder="https://" className={adminInput} />
        </label>
        <label className={adminLabel}>
          <span className={adminLabelText}>Logo image link (optional)</span>
          <input name="logoUrl" type="url" defaultValue={p.logoUrl ?? ""} placeholder="https://.../logo.png" className={adminInput} />
        </label>
        <label className={adminLabel}>
          <span className={adminLabelText}>Order (lowest first)</span>
          <input name="sortOrder" type="number" min={0} max={9999} defaultValue={p.sortOrder} className={adminInput} />
        </label>
      </div>
      <label className={adminLabel}>
        <span className={adminLabelText}>Short description (optional, up to 140)</span>
        <input name="description" defaultValue={p.description ?? ""} maxLength={140} className={adminInput} />
      </label>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={p.active} />
          Show in the footer
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="sponsored" defaultChecked={p.sponsored} />
          Paid / sponsored link (adds rel=&quot;sponsored nofollow&quot;)
        </label>
      </div>
    </>
  );
}
