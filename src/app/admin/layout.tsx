import { requireAdmin } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <AdminSidebar email={session.user.email ?? "admin"} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
