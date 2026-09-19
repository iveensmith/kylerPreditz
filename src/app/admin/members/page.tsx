import { SubscriptionStatus } from "@/generated/prisma/enums";
import { getMembersForAdmin } from "@/lib/queries/admin";
import { parsePageParam } from "@/lib/pagination";
import { adminBtn, adminInput } from "@/lib/admin-ui";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/ui/Pagination";

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

export default async function AdminMembersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const { items: users, meta } = await getMembersForAdmin(parsePageParam(sp.page), q);
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Membership" title={`Members · ${meta.total.toLocaleString("en-US")}`} />

      <form className="flex max-w-md gap-2">
        <input name="q" defaultValue={q} type="search" placeholder="Search by email" className={`${adminInput} flex-1`} />
        <button type="submit" className={adminBtn}>Search</button>
      </form>

      {users.length === 0 ? (
        <p className="text-sm text-muted">{q ? `No members match "${q}".` : "No members yet."}</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Role</th>
                <th className="px-3 py-2 text-left font-medium">Verified</th>
                <th className="px-3 py-2 text-left font-medium">Plan</th>
                <th className="px-3 py-2 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const sub = u.subscriptions[0];
                const active = sub && sub.status === SubscriptionStatus.ACTIVE && sub.expiresAt > now;
                return (
                  <tr key={u.id} className="border-t border-line">
                    <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                    <td className="px-3 py-2 font-mono text-xs uppercase text-muted">{u.role}</td>
                    <td className="px-3 py-2">{u.emailVerified ? "Yes" : <span className="text-faint">No</span>}</td>
                    <td className="px-3 py-2">
                      {!sub ? <span className="text-faint">—</span> : active ? (
                        <span className="text-win">{sub.plan} · until {sub.expiresAt.toISOString().slice(0, 10)}</span>
                      ) : (
                        <span className="text-muted">{sub.plan} · expired</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">{u.createdAt.toISOString().slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={meta} basePath="/admin/members" query={{ q }} />
    </div>
  );
}
